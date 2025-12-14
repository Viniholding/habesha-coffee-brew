import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, CreditCard, MapPin, AlertTriangle, Shield } from 'lucide-react';

interface CrossAccountFlag {
  type: 'shared_payment' | 'shared_address';
  linkedUserId: string;
  linkedUserEmail?: string;
  isRestricted: boolean;
}

interface AccountNode {
  id: string;
  userId: string;
  email: string;
  isRestricted: boolean;
  abuseScore: number;
  crossAccountFlags: CrossAccountFlag[];
}

interface AccountRelationshipGraphProps {
  accounts: AccountNode[];
}

const AccountRelationshipGraph = ({ accounts }: AccountRelationshipGraphProps) => {
  // Build a graph of relationships
  const { nodes, edges, clusters } = useMemo(() => {
    const nodeMap = new Map<string, AccountNode>();
    accounts.forEach(acc => nodeMap.set(acc.userId, acc));

    const edgeSet = new Set<string>();
    const edges: { from: string; to: string; type: 'payment' | 'address'; fromRestricted: boolean; toRestricted: boolean }[] = [];

    accounts.forEach(acc => {
      acc.crossAccountFlags.forEach(flag => {
        const edgeKey = [acc.userId, flag.linkedUserId].sort().join('-');
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            from: acc.userId,
            to: flag.linkedUserId,
            type: flag.type === 'shared_payment' ? 'payment' : 'address',
            fromRestricted: acc.isRestricted,
            toRestricted: flag.isRestricted,
          });
        }
      });
    });

    // Cluster connected nodes
    const visited = new Set<string>();
    const clusters: string[][] = [];

    const dfs = (userId: string, cluster: string[]) => {
      if (visited.has(userId)) return;
      visited.add(userId);
      cluster.push(userId);

      edges.forEach(e => {
        if (e.from === userId && !visited.has(e.to)) dfs(e.to, cluster);
        if (e.to === userId && !visited.has(e.from)) dfs(e.from, cluster);
      });
    };

    accounts.forEach(acc => {
      if (!visited.has(acc.userId) && acc.crossAccountFlags.length > 0) {
        const cluster: string[] = [];
        dfs(acc.userId, cluster);
        if (cluster.length > 1) clusters.push(cluster);
      }
    });

    return { nodes: nodeMap, edges, clusters };
  }, [accounts]);

  if (clusters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Account Relationship Graph
          </CardTitle>
          <CardDescription>Visual connections between flagged accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No cross-account relationships detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-destructive text-destructive-foreground';
    if (score >= 50) return 'bg-orange-500 text-white';
    if (score >= 25) return 'bg-yellow-500 text-black';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Account Relationship Graph
          <Badge variant="destructive" className="ml-2">{clusters.length} Clusters</Badge>
        </CardTitle>
        <CardDescription>Visual connections between potentially linked fraudulent accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {clusters.map((cluster, clusterIndex) => {
            const clusterEdges = edges.filter(e => 
              cluster.includes(e.from) && cluster.includes(e.to)
            );
            const hasRestrictedAccount = cluster.some(userId => nodes.get(userId)?.isRestricted);

            return (
              <div 
                key={clusterIndex} 
                className={`p-4 rounded-lg border-2 ${hasRestrictedAccount ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className={`h-4 w-4 ${hasRestrictedAccount ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <span className="font-semibold text-sm">
                    Cluster {clusterIndex + 1} - {cluster.length} linked accounts
                  </span>
                  {hasRestrictedAccount && (
                    <Badge variant="destructive" className="text-xs">Contains Restricted</Badge>
                  )}
                </div>

                {/* Visual Graph */}
                <div className="relative min-h-[200px] bg-background rounded-lg p-4 overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {clusterEdges.map((edge, i) => {
                      const fromIndex = cluster.indexOf(edge.from);
                      const toIndex = cluster.indexOf(edge.to);
                      const total = cluster.length;
                      
                      // Position nodes in a circle
                      const radius = Math.min(80, 150 / Math.max(1, total - 2));
                      const centerX = 50;
                      const centerY = 50;
                      
                      const fromAngle = (fromIndex / total) * 2 * Math.PI - Math.PI / 2;
                      const toAngle = (toIndex / total) * 2 * Math.PI - Math.PI / 2;
                      
                      const x1 = centerX + radius * Math.cos(fromAngle);
                      const y1 = centerY + radius * Math.sin(fromAngle);
                      const x2 = centerX + radius * Math.cos(toAngle);
                      const y2 = centerY + radius * Math.sin(toAngle);

                      const strokeColor = edge.fromRestricted || edge.toRestricted 
                        ? 'hsl(var(--destructive))' 
                        : edge.type === 'payment' 
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted-foreground))';

                      return (
                        <line
                          key={i}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke={strokeColor}
                          strokeWidth="2"
                          strokeDasharray={edge.type === 'address' ? '4 2' : undefined}
                          opacity={0.7}
                        />
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '200px' }}>
                    {cluster.map((userId, index) => {
                      const account = nodes.get(userId);
                      if (!account) return null;

                      const total = cluster.length;
                      const radius = Math.min(80, 150 / Math.max(1, total - 2));
                      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
                      const x = 50 + radius * Math.cos(angle);
                      const y = 50 + radius * Math.sin(angle);

                      return (
                        <div
                          key={userId}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ left: `${x}%`, top: `${y}%` }}
                        >
                          <div 
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-lg ${
                              account.isRestricted 
                                ? 'bg-destructive border-destructive text-destructive-foreground' 
                                : getScoreColor(account.abuseScore)
                            }`}
                            title={`${account.email}\nScore: ${account.abuseScore}`}
                          >
                            <span className="text-xs font-bold">{account.abuseScore}</span>
                          </div>
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <span className="text-xs bg-background px-1 rounded truncate max-w-20 block text-center">
                              {account.email.split('@')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Edge Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    <span>Solid = Shared Payment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Dashed = Shared Address</span>
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-4 grid gap-2">
                  {cluster.map(userId => {
                    const account = nodes.get(userId);
                    if (!account) return null;

                    const paymentLinks = account.crossAccountFlags.filter(f => f.type === 'shared_payment').length;
                    const addressLinks = account.crossAccountFlags.filter(f => f.type === 'shared_address').length;

                    return (
                      <div 
                        key={userId}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          account.isRestricted ? 'bg-destructive/10' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {account.isRestricted && <Shield className="h-4 w-4 text-destructive" />}
                          <span className="font-medium truncate max-w-48">{account.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {paymentLinks > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {paymentLinks}
                            </Badge>
                          )}
                          {addressLinks > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {addressLinks}
                            </Badge>
                          )}
                          <Badge className={getScoreColor(account.abuseScore)}>
                            {account.abuseScore}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountRelationshipGraph;
