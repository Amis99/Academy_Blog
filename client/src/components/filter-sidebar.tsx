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
    "서울특별시": ["강남구", "서초구", "송파구", "마포구", "종로구", "중구", "용산구", "강서구", "노원구", "은평구", "강동구", "관악구", "구로구", "금천구", "도봉구", "동대문구", "동작구", "서대문구", "성동구", "성북구", "양천구", "영등포구", "중랑구"],
    "경기도": ["수원시", "고양시", "용인시", "성남시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시", "의정부시", "시흥시", "파주시", "광명시", "김포시", "군포시", "오산시", "이천시", "안성시", "구리시", "의왕시", "포천시", "양주시", "동두천시", "가평군", "연천군"],
    "인천광역시": ["남동구", "부평구", "서구", "연수구", "계양구", "미추홀구", "동구", "중구", "강화군", "옹진군"],
    "부산광역시": ["해운대구", "부산진구", "동래구", "남구", "북구", "사상구", "사하구", "금정구", "강서구", "연제구", "수영구", "중구", "동구", "서구", "영도구", "기장군"],
    "대구광역시": ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군"],
    "광주광역시": ["동구", "서구", "남구", "북구", "광산구"],
    "대전광역시": ["중구", "동구", "서구", "유성구", "대덕구"],
    "울산광역시": ["중구", "남구", "동구", "북구", "울주군"],
    "세종특별자치시": ["세종시"],
    "강원도": ["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군"],
    "충청북도": ["청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"],
    "충청남도": ["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"],
    "전라북도": ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"],
    "전라남도": ["목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"],
    "경상북도": ["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "군위군", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"],
    "경상남도": ["창원시", "김해시", "진주시", "양산시", "거제시", "통영시", "사천시", "밀양시", "함안군", "거창군", "창녕군", "고성군", "하동군", "합천군", "함양군", "산청군", "의령군", "남해군"],
    "제주특별자치도": ["제주시", "서귀포시"]
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
