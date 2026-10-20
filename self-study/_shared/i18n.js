/* Chuỗi giao diện theo ngôn ngữ trang: <html lang="vi|en">. */
(function(){
var L=(document.documentElement.getAttribute('lang')||'vi').slice(0,2);
var D={
vi:{score:'Điểm',done:'câu đã làm',ok:'✅ Chính xác!',no:'❌ Chưa đúng. Đáp án đúng: ',redoQ:'↺ Làm lại câu này',redoAll:'↺ Làm lại toàn bộ bài',confirmAll:'Xóa kết quả và làm lại từ đầu?',
 panel:'Bảng điều khiển',source:'Nguồn',all:'Tất cả',orig:'Câu gốc từ tài liệu',extra:'Bổ sung',level:'Mức độ',lv1:'Cơ bản (1)',lv2:'Vừa (2)',lv3:'Khó (3)',topic:'Chủ đề',type:'Dạng câu',
 onlyWrong:' chỉ câu đã làm sai',shuffle:'🔀 Xáo trộn thứ tự',origOrder:'⟲ Về thứ tự gốc',resetAll:'↺ Làm lại toàn bộ (xóa kết quả)',confirmReset:'Xóa toàn bộ kết quả của ngân hàng này và làm lại từ đầu?',
 progress:'Tiến độ: đã làm',correct:'đúng',wrong:'sai',rate:'tỉ lệ đúng',showing:'Hiển thị',questions:'câu',page:'trang',prev:'◀ Trang trước',next:'Trang sau ▶',
 theory:'Lý thuyết',code:'Đọc code / mô hình',write:'Viết code',mcq:'Trắc nghiệm',ess:'Viết code',
 essHint:'Hãy tự viết code trước, rồi bấm "Xem lời giải" để đối chiếu. Đánh dấu bài đã làm được để theo dõi tiến độ.',showSol:'👁 Xem lời giải',hideSol:'🙈 Ẩn lời giải',markDone:'Đánh dấu: tôi đã làm được',marked:'✔ Đã làm được (bấm để bỏ)',essDone:'Đã làm được',of:'/',starter:'Khung code cho sẵn',tests:'Kiểm thử (đầu vào → kết quả mong đợi)',solution:'Lời giải'},
en:{score:'Score',done:'answered',ok:'✅ Correct!',no:'❌ Not quite. Correct answer: ',redoQ:'↺ Retry this question',redoAll:'↺ Restart the whole quiz',confirmAll:'Clear results and start over?',
 panel:'Control panel',source:'Source',all:'All',orig:'Original questions from the sources',extra:'Added',level:'Level',lv1:'Basic (1)',lv2:'Medium (2)',lv3:'Hard (3)',topic:'Topic',type:'Question type',
 onlyWrong:' only questions I got wrong',shuffle:'🔀 Shuffle order',origOrder:'⟲ Original order',resetAll:'↺ Restart all (clear results)',confirmReset:'Clear all results of this bank and start over?',
 progress:'Progress: answered',correct:'correct',wrong:'wrong',rate:'accuracy',showing:'Showing',questions:'questions',page:'page',prev:'◀ Previous',next:'Next ▶',
 theory:'Theory',code:'Code / model reading',write:'Write code',mcq:'Multiple choice',ess:'Write code',
 essHint:'Write your own code first, then press "Show solution" to compare. Mark the tasks you solved to track progress.',showSol:'👁 Show solution',hideSol:'🙈 Hide solution',markDone:'Mark: I solved it',marked:'✔ Solved (click to undo)',essDone:'Solved',of:'/',starter:'Starter code',tests:'Tests (input → expected output)',solution:'Solution'}};
window.QC_L=L;window.QC_T=D[L]||D.vi;
})();
