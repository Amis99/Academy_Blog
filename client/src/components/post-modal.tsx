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
    province: "",
    district: "",
    subject: "",
    targetGrade: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const provinces = {
    "서울특별시": ["강남구", "서초구", "송파구", "마포구", "종로구", "중구", "용산구", "강서구", "노원구", "은평구"],
    "경기도": ["수원시", "고양시", "용인시", "성남시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시"],
    "인천광역시": ["남동구", "부평구", "서구", "연수구", "계양구", "미추홀구", "동구", "중구", "강화군", "옹진군"],
    "부산광역시": ["해운대구", "부산진구", "동래구", "남구", "북구", "사상구", "사하구", "금정구", "강서구", "연제구"],
    "대구광역시": ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군"],
    "광주광역시": ["동구", "서구", "남구", "북구", "광산구"],
    "대전광역시": ["중구", "동구", "서구", "유성구", "대덕구"],
    "울산광역시": ["중구", "남구", "동구", "북구", "울주군"]
  };
  
  const subjects = ["수학", "영어", "국어", "과학", "사회", "음악", "미술", "무용", "체육", "컴퓨터", "기타"];
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

    const regionValue = formData.district ? `${formData.province} ${formData.district}` : formData.province;

    const data = new FormData();
    data.append("title", formData.title);
    data.append("content", formData.content);
    data.append("region", regionValue);
    data.append("subject", formData.subject);
    data.append("targetGrade", formData.targetGrade);
    
    imageFiles.forEach((file) => {
      data.append("images", file);
    });

    createPostMutation.mutate(data);
  };

  const handleProvinceChange = (value: string) => {
    setFormData({...formData, province: value, district: ""});
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 20) {
      toast({
        title: "파일 개수 초과",
        description: "최대 20개의 이미지만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }
    setImageFiles(files);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>광고 등록</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">광역시/도</Label>
              <Select value={formData.province} onValueChange={handleProvinceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="광역시/도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(provinces).map((province) => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="district">구/군/시</Label>
              <Select value={formData.district} onValueChange={(value) => setFormData({...formData, district: value})} disabled={!formData.province}>
                <SelectTrigger>
                  <SelectValue placeholder="구/군/시 선택" />
                </SelectTrigger>
                <SelectContent>
                  {formData.province && provinces[formData.province as keyof typeof provinces]?.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
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
            <Label htmlFor="image">이미지 업로드 (최대 20개)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 mb-2">이미지를 선택하세요 (최대 20개)</p>
              <input
                type="file"
                accept="image/*"
                multiple
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
              {imageFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    선택된 파일: {imageFiles.length}개
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="truncate">{file.name}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
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
