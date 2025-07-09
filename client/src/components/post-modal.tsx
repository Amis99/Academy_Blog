import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { X, Upload } from "lucide-react";

interface PostModalProps {
  onClose: () => void;
}

export default function PostModal({ onClose }: PostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    region: "",
    subject: "",
    targetGrade: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const regions = ["강남구", "서초구", "송파구", "마포구", "종로구", "중구", "용산구"];
  const subjects = ["수학", "영어", "국어", "과학", "사회"];
  const grades = ["초등학생", "중학생", "고등학생", "재수생"];

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "성공",
        description: "게시글이 등록되었습니다.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.status !== "approved") {
      toast({
        title: "권한 없음",
        description: "승인된 사용자만 게시글을 작성할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("content", formData.content);
    data.append("region", formData.region);
    data.append("subject", formData.subject);
    data.append("targetGrade", formData.targetGrade);
    
    if (imageFile) {
      data.append("image", imageFile);
    }

    createPostMutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>광고 등록</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="region">지역</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subject">과목</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({...formData, subject: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="과목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="targetGrade">대상 학년</Label>
              <Select value={formData.targetGrade} onValueChange={(value) => setFormData({...formData, targetGrade: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="학년 선택" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="광고 제목을 입력하세요"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="광고 내용을 입력하세요"
              rows={6}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="image">이미지 업로드</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 mb-2">이미지를 선택하세요</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageInput"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => document.getElementById('imageInput')?.click()}
              >
                파일 선택
              </Button>
              {imageFile && (
                <p className="text-sm text-gray-600 mt-2">
                  선택된 파일: {imageFile.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "등록 중..." : "등록하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
