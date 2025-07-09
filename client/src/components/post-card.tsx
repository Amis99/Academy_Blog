import { useState } from "react";
import { PostWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Heart, Share2, GraduationCap, BookOpen, FlaskConical, ChevronDown, ChevronUp, Music, Palette, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: PostWithAuthor;
}

const subjectIcons = {
  수학: GraduationCap,
  영어: BookOpen,
  과학: FlaskConical,
  국어: BookOpen,
  사회: BookOpen,
  음악: Music,
  미술: Palette,
  무용: Dumbbell,
  체육: Dumbbell,
  컴퓨터: GraduationCap,
  기타: BookOpen,
};

const subjectColors = {
  수학: "bg-blue-600",
  영어: "bg-green-500",
  과학: "bg-red-500",
  국어: "bg-purple-500",
  사회: "bg-orange-500",
  음악: "bg-pink-500",
  미술: "bg-yellow-500",
  무용: "bg-indigo-500",
  체육: "bg-teal-500",
  컴퓨터: "bg-cyan-500",
  기타: "bg-gray-500",
};

export default function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { toast } = useToast();
  
  const IconComponent = subjectIcons[post.subject as keyof typeof subjectIcons] || GraduationCap;
  const iconColor = subjectColors[post.subject as keyof typeof subjectColors] || "bg-gray-500";

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    toast({
      title: isLiked ? "좋아요 취소" : "좋아요!",
      description: isLiked ? "좋아요를 취소했습니다." : "게시글에 좋아요를 눌렀습니다.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "공유 링크 복사",
        description: "링크가 클립보드에 복사되었습니다.",
      });
    }
  };

  const shouldShowExpand = post.content.length > 150;
  const displayContent = shouldShowExpand && !isExpanded 
    ? post.content.slice(0, 150) + "..." 
    : post.content;

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${iconColor} rounded-full flex items-center justify-center`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{post.author.username}</h3>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {post.region}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {post.subject}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {post.targetGrade}
            </Badge>
          </div>
        </div>

        <h4 className="text-lg font-semibold text-gray-900 mb-3">{post.title}</h4>
        <div className="text-gray-600 mb-4">
          <p>{displayContent}</p>
          {shouldShowExpand && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-700 p-0"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  더보기
                </>
              )}
            </Button>
          )}
        </div>

        {post.imageUrl && (
          <div className="mb-4">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsImageModalOpen(true)}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {viewCount}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`flex items-center space-x-1 p-0 h-auto ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="text-blue-600 hover:text-blue-700"
          >
            <Share2 className="w-4 h-4 mr-1" />
            공유
          </Button>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{post.title}</DialogTitle>
          </DialogHeader>
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
}
