import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, User, Presentation } from 'lucide-react';
import { Topic } from '../types';

const FIELDS = [
  "Tất cả các lĩnh vực",
  "Khoa học giáo dục và đào tạo giáo viên",  
  "Ngôn ngữ, văn học và văn hóa Việt Nam",
  "Ngôn ngữ, văn học và văn hóa nước ngoài",
  "Ngôn ngữ học",
  "Lịch sử Việt Nam",
  "Lịch sử thế giới",
  "Khoa học xã hội và hành vi",  
  "Khoa học sự sống",
  "Khoa học tự nhiên",
  "Toán và thống kê",
  "Máy tính và công nghệ thông tin"
];

export const TopicChecker: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [source, setSource] = useState<'internal' | 'google'>('internal');
  const [selectedField, setSelectedField] = useState('Tất cả lĩnh vực');
  const [results, setResults] = useState<Topic[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Fetch dữ liệu từ Google Sheet khi chọn internal
  useEffect(() => {
    if (source === 'internal') {
      const fetchTopics = async () => {
        try {
          const res = await fetch(
            'https://gsx2json.com/api?id=1mjZfKOJW_4C_jcadBFFECwa1squ90bj1q3nIVLRXlUM&sheet=tendetai'
          );
          const data = await res.json();         

          if (!data || !data.rows) {
             setTopics([]);
             return;
          }

          const mapped: Topic[] = data.rows.map((row: any, index: number) => ({
            id: index + 1,
            name: row.TENDETAI,       // lấy theo tên cột
            author: row.MSHV,
            score: row.DIEM_BV ? parseFloat(row.DIEM_BV) : null,
            date: row.NGAYBAOVE || null,
            status: row.NGAYBAOVE ? 'Đã bảo vệ' : 'Đang thực hiện',
            field: row.LINHVUC || 'Chưa phân loại',
          }));
          setTopics(mapped);
        } catch (err) {
          console.error(err);
          setTopics([]);
        }
      };
      fetchTopics();
    }
  }, [source]);

  // Realtime filter khi gõ nếu chọn internal
  useEffect(() => {
    if (source === 'internal') {
      if (searchTerm.trim()) {
        const filtered = topics.filter(t =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (selectedField === 'Tất cả lĩnh vực' || t.field === selectedField)
        );
        setResults(filtered);
        setHasSearched(true);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }
  }, [searchTerm, selectedField, source, topics]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    if (source === 'google') {
      const query = encodeURIComponent(searchTerm);
      window.open(`https://scholar.google.com/scholar?q=${query}`, '_blank');
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 animate-fade-in border border-gray-100 min-h-[600px]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-red-600 mb-2">Tra cứu Trùng lặp Đề tài</h2>
        <p className="text-green-700 font-medium">Kiểm tra xem ý tưởng của bạn đã có ai nghiên cứu tại ĐHSP TP.HCM chưa.</p>

      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex gap-6 justify-center mb-2">
          <label className="flex items-center gap-2">
            <input type="radio" value="internal" checked={source === 'internal'} onChange={() => setSource('internal')} />
            <span className="text-sm font-medium text-gray-700">Nguồn ĐHSP TP.HCM</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="google" checked={source === 'google'} onChange={() => setSource('google')} />
            <span className="text-sm font-medium text-gray-700">Nguồn Google Scholar</span>
          </label>
        </div>

        {source === 'internal' && (
          <div className="mb-4 text-center">
            <select
              value={selectedField}
              onChange={e => setSelectedField(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {FIELDS.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-full pl-6 pr-14 py-4 text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
            placeholder="Nhập tên đề tài hoặc từ khóa..."
          />
          {source === 'google' && (
            <button 
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 rounded-full hover:bg-blue-700 transition font-bold"
            >
              Tìm
            </button>
          )}
          <button 
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 px-6 rounded-full hover:bg-gray-300 transition font-bold"
          >
            Làm lại
          </button>
        </div>

        {hasSearched && source === 'internal' && (
          <div className="animate-fade-in">
            {results.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start text-yellow-800 mb-4">
                  <AlertCircle size={20} className="mr-3 mt-1" />
                  <div>
                    <p className="font-semibold mb-2">Tìm thấy <strong>{results.length}</strong> đề tài có liên quan.</p>
                    <ul className="list-disc ml-5 text-sm space-y-1">
                      <li>Đề tài bạn nhập đã từng được nghiên cứu tại ĐHSP TP.HCM.</li>
                      <li>Việc trùng lặp có thể ảnh hưởng đến tính mới và khả năng được duyệt.</li>
                      <li>Hãy cân nhắc điều chỉnh tên đề tài, phạm vi nghiên cứu hoặc phương pháp tiếp cận.</li>
                      <li>Tham khảo hướng dẫn viết đề tài không trùng lặp hoặc liên hệ bộ phận đào tạo để được tư vấn.</li>
                    </ul>
                  </div>
                </div>

                {results.map(topic => (
                  <div key={topic.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-blue-900 mb-1">{topic.name}</h3>
                        <p className="text-gray-600 text-sm mb-2"><User size={14} className="inline mr-1"/> {topic.author}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        topic.status === 'Đã bảo vệ' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {topic.status}
                      </span>
                    </div>
                    {topic.status === 'Đã bảo vệ' && (
                        <div className="mt-3 flex space-x-6 text-sm text-gray-500 border-t pt-3">
                          <span className="flex items-center">
                            <CheckCircle size={14} className="mr-1 text-green-500" />
                            <span>Điểm:&nbsp;</span>
                            <strong>{topic.score !== null ? topic.score.toFixed(2) : 'N/A'}</strong>
                          </span>
                          <span className="flex items-center">
                            <Presentation size={14} className="mr-1 text-blue-500"/> Ngày bảo vệ: {topic.date}
                          </span>
                          <span className="flex items-center">
                            <Presentation size={14} className="mr-1 text-purple-500"/> Lĩnh vực: {topic.field}
                          </span>
                        </div>
                      )}

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Chưa phát hiện trùng lặp!</h3>
                <p className="text-gray-600 mt-2">Từ khóa "{searchTerm}" chưa có trong cơ sở dữ liệu.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};