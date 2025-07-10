import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Comment, insertCommentSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, Trash2, User } from "lucide-react";
import { z } from "zod";

const commentFormSchema = insertCommentSchema.extend({
  authorName: z.string().min(1, "이름을 입력해주세요"),
  authorPassword: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
  content: z.string().min(1, "댓글 내용을 입력해주세요"),
});

type CommentFormData = z.infer<typeof commentFormSchema>;

interface CommentSectionProps {
  postId: number;
  postAuthorId: number;
}

export default function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      return response.json();
    },
  });

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      authorName: "",
      authorPassword: "",
      content: "",
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      form.reset();
      toast({
        title: "성공",
        description: "댓글이 등록되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "댓글 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, password }: { commentId: number; password: string }) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      setIsDeleteDialogOpen(false);
      setDeletePassword("");
      setSelectedCommentId(null);
      toast({
        title: "성공",
        description: "댓글이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "댓글 삭제에 실패했습니다. 비밀번호를 확인해주세요.",
        variant: "destructive",
      });
    },
  });

  const deleteCommentAsAuthorMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      toast({
        title: "성공",
        description: "댓글이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "댓글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommentFormData) => {
    createCommentMutation.mutate(data);
  };

  const handleDeleteComment = (commentId: number) => {
    setSelectedCommentId(commentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteComment = () => {
    if (selectedCommentId) {
      deleteCommentMutation.mutate({ commentId: selectedCommentId, password: deletePassword });
    }
  };

  const canDeleteComment = user && (user.id === postAuthorId || user.isAdmin);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>댓글 {comments?.length || 0}개</span>
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Comment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">댓글 쓰기</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="authorName">이름</Label>
                    <Input
                      id="authorName"
                      {...form.register("authorName")}
                      placeholder="이름을 입력하세요"
                    />
                    {form.formState.errors.authorName && (
                      <p className="text-sm text-red-500">{form.formState.errors.authorName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="authorPassword">비밀번호</Label>
                    <Input
                      id="authorPassword"
                      type="password"
                      {...form.register("authorPassword")}
                      placeholder="비밀번호를 입력하세요"
                    />
                    {form.formState.errors.authorPassword && (
                      <p className="text-sm text-red-500">{form.formState.errors.authorPassword.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="content">댓글 내용</Label>
                  <Textarea
                    id="content"
                    {...form.register("content")}
                    placeholder="댓글을 입력하세요"
                    rows={3}
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={createCommentMutation.isPending}>
                  {createCommentMutation.isPending ? "등록 중..." : "댓글 등록"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : comments?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">댓글이 없습니다.</p>
            ) : (
              comments?.map((comment) => (
                <Card key={comment.id} className="border-l-4 border-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        {canDeleteComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommentAsAuthorMutation.mutate(comment.id)}
                            disabled={deleteCommentAsAuthorMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-700" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Comment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              댓글을 삭제하려면 작성 시 입력한 비밀번호를 입력하세요.
            </p>
            <div>
              <Label htmlFor="deletePassword">비밀번호</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteComment}
                disabled={deleteCommentMutation.isPending || !deletePassword}
              >
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}