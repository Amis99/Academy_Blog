import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterSidebarProps {
  onFilterChange: (filters: { region: string; subject: string; targetGrade: string }) => void;
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [province, setProvince] = useState("all");
  const [district, setDistrict] = useState("all");
  const [subject, setSubject] = useState("all");
  const [targetGrade, setTargetGrade] = useState("all");

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

  const handleApplyFilters = () => {
    let regionValue = "";
    if (province !== "all" && district !== "all") {
      regionValue = `${province} ${district}`;
    } else if (province !== "all") {
      regionValue = province;
    }
    
    onFilterChange({ 
      region: regionValue, 
      subject: subject === "all" ? "" : subject, 
      targetGrade: targetGrade === "all" ? "" : targetGrade 
    });
  };

  const handleResetFilters = () => {
    setProvince("all");
    setDistrict("all");
    setSubject("all");
    setTargetGrade("all");
    onFilterChange({ region: "", subject: "", targetGrade: "" });
  };

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict("all"); // Reset district when province changes
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
          <label className="block text-sm font-medium text-gray-700 mb-2">광역시/도</label>
          <Select value={province} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder="전체 지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 지역</SelectItem>
              {Object.keys(provinces).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">구/군/시</label>
          <Select value={district} onValueChange={setDistrict} disabled={province === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="전체 구/군/시" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 구/군/시</SelectItem>
              {province !== "all" && provinces[province as keyof typeof provinces]?.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
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
