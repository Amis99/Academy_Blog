import { PostWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Share2, GraduationCap, BookOpen, FlaskConical } from "lucide-react";

interface PostCardProps {
  post: PostWithAuthor;
}

const subjectIcons = {
  수학: GraduationCap,
  영어: BookOpen,
  과학: FlaskConical,
  국어: BookOpen,
  사회: BookOpen,
};

const subjectColors = {
  수학: "bg-blue-600",
  영어: "bg-green-500",
  과학: "bg-red-500",
  국어: "bg-purple-500",
  사회: "bg-orange-500",
};

export default function PostCard({ post }: PostCardProps) {
  const IconComponent = subjectIcons[post.subject] || GraduationCap;
  const iconColor = subjectColors[post.subject] || "bg-gray-500";

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
        <p className="text-gray-600 mb-4">{post.content}</p>

        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              조회수
            </span>
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              좋아요
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            <Share2 className="w-4 h-4 mr-1" />
            공유
          </Button>
        </div>
      </div>
    </article>
  );
}
