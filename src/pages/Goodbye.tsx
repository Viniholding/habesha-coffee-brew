import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Coffee } from "lucide-react";

export default function Goodbye() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Coffee className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">We'll Miss You</CardTitle>
            <CardDescription className="text-base">
              Your account has been successfully deleted. Thank you for being part of our coffee community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We hope to see you again in the future. If you change your mind, you're always welcome to create a new account.
            </p>
            <div className="pt-4 space-y-2">
              <Button 
                onClick={() => navigate("/")} 
                className="w-full"
              >
                Return to Home
              </Button>
              <Button 
                onClick={() => navigate("/auth")} 
                variant="outline"
                className="w-full"
              >
                Create New Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
