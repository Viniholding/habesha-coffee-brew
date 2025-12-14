import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Video {
  id: string;
  title: string;
  url: string;
  description?: string;
}

interface VideoCarouselProps {
  videos: Video[];
}

export default function VideoCarousel({ videos }: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying || videos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, videos.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  if (videos.length === 0) {
    return (
      <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No videos available</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="space-y-6">
      {/* Main Video */}
      <div className="relative">
        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black/5">
          <iframe
            key={currentVideo.id}
            className="absolute inset-0 w-full h-full"
            src={currentVideo.url}
            title={currentVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Navigation Arrows */}
        {videos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Video Info & Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{currentVideo.title}</h3>
          {currentVideo.description && (
            <p className="text-sm text-muted-foreground truncate">{currentVideo.description}</p>
          )}
        </div>

        {videos.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="gap-2"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto-play</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {videos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-border"
              )}
            >
              <div className="aspect-video bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-6 h-6 text-white/80" />
                </div>
              </div>
              <div className="p-2 bg-card">
                <p className="text-xs font-medium text-foreground truncate">{video.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dots Indicator */}
      {videos.length > 1 && (
        <div className="flex justify-center gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-6 bg-primary"
                  : "bg-border hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
