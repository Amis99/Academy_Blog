import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterSidebarProps {
  onFilterChange: (filters: { region: string; subject: string; targetGrade: string }) => void;
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [region, setRegion] = useState("all");
  const [subject, setSubject] = useState("all");
  const [targetGrade, setTargetGrade] = useState("all");

  const regions = ["강남구", "서초구", "송파구", "마포구", "종로구", "중구", "용산구"];
  const subjects = ["수학", "영어", "국어", "과학", "사회"];
  const grades = ["초등학생", "중학생", "고등학생", "재수생"];

  const handleApplyFilters = () => {
    onFilterChange({ 
      region: region === "all" ? "" : region, 
      subject: subject === "all" ? "" : subject, 
      targetGrade: targetGrade === "all" ? "" : targetGrade 
    });
  };

  const handleResetFilters = () => {
    setRegion("all");
    setSubject("all");
    setTargetGrade("all");
    onFilterChange({ region: "", subject: "", targetGrade: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>필터</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger>
              <SelectValue placeholder="전체 지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 지역</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">과목</label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="전체 과목" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 과목</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">대상 학년</label>
          <Select value={targetGrade} onValueChange={setTargetGrade}>
            <SelectTrigger>
              <SelectValue placeholder="전체 학년" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 학년</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleApplyFilters}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            필터 적용
          </Button>
          <Button 
            onClick={handleResetFilters}
            variant="outline"
            className="w-full"
          >
            초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
