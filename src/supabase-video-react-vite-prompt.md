# Prompt cho Gemini / Claude: Tối ưu video MP4 trên Supabase với React Vite

Mục tiêu: refactor luồng upload và phát video MP4 đang dùng Supabase Storage trong app React + Vite để giảm cached egress, giảm bandwidth, và giữ code dễ maintain.

## Bối cảnh

- Frontend đang dùng React + Vite.
- Storage đang dùng Supabase.
- Hiện tại video được upload rồi phát trực tiếp bằng file MP4 public URL.
- Vấn đề đang gặp là Supabase báo vượt quota `cached egress` trên Free Plan.[cite:1][cite:9]
- Supabase cho phép set `cacheControl`, `contentType`, và `upsert` khi upload file qua JavaScript client.[cite:39][cite:42]
- Supabase cũng hỗ trợ lấy public URL từ Storage để phát trực tiếp asset public.[cite:45][cite:48]

## Việc cần làm

Hãy giúp viết code production-ready cho React + Vite theo các yêu cầu sau:

1. Tạo cấu trúc code rõ ràng gồm:
   - `src/lib/supabase.ts`
   - `src/lib/video/uploadVideo.ts`
   - `src/lib/video/getVideoUrl.ts`
   - `src/components/VideoPlayer.tsx`
   - `src/components/VideoUpload.tsx`

2. Luồng upload phải:
   - Upload vào bucket `videos`.
   - Dùng path có version hoặc tên file unique, ví dụ `users/{userId}/videos/{uuid}-v1.mp4`, để tránh overwrite cùng URL vì dễ gây vấn đề cache.[cite:34][cite:51]
   - Set `cacheControl` dài, ví dụ `31536000`.
   - Set `contentType` đúng theo MIME của file.
   - Dùng `upsert: false`.

3. Luồng phát video phải:
   - Dùng `getPublicUrl()` để lấy URL phát video.[cite:48]
   - Dùng thẻ HTML5 `<video>` trong React.
   - Mặc định `preload="metadata"` để tránh tải quá nhiều dữ liệu ngay từ đầu.[cite:45]
   - Hỗ trợ `controls`, `playsInline`, `poster`.

4. Tối ưu egress ở frontend:
   - Không autoplay hàng loạt video trong list.
   - Chỉ mount player khi cần.
   - Ưu tiên hiển thị poster trước.
   - Nêu rõ chỗ nào giúp giảm request lặp hoặc giảm băng thông.

5. Tối ưu trước khi upload:
   - Đề xuất một bước client-side validation: giới hạn dung lượng file, định dạng hợp lệ, và cảnh báo nếu video quá lớn.
   - Nếu phù hợp, thêm ví dụ dùng FFmpeg ở backend hoặc CI để encode video nhỏ hơn trước khi đưa vào production, vì dung lượng file ảnh hưởng trực tiếp đến egress.[cite:1][cite:28]

6. Bảo mật và policy:
   - Giải thích ngắn gọn khi nào nên dùng public bucket cho video.
   - Nếu private bucket phù hợp hơn, hãy nêu trade-off và đưa ví dụ signed URL.
   - Nếu dùng public bucket, viết ví dụ SQL policy tối thiểu hoặc giải thích tại sao policy có thể đơn giản hơn.

7. Output mong muốn:
   - Code TypeScript đầy đủ, copy-paste được.
   - Mỗi file phải có giải thích ngắn ngay trước code block.
   - Có một section “Tại sao cách này giảm cached egress”.
   - Có một section “Khi nào nên chuyển từ MP4 sang HLS”. Vì video MP4 direct play vẫn kém tối ưu hơn adaptive streaming khi video dài hoặc nhiều người xem.[cite:25][cite:27]

## Ràng buộc kỹ thuật

- Dùng TypeScript.
- Code theo style hiện đại, đơn giản, dễ maintain.
- Không dùng class component.
- Không dùng thư viện upload thừa nếu Supabase client đã đủ.
- Ưu tiên function nhỏ, typed rõ ràng.
- Tránh overengineering.

## Yêu cầu chất lượng câu trả lời

- Trả lời bằng tiếng Việt.
- Ưu tiên code thực tế hơn lý thuyết.
- Nêu rõ các quyết định quan trọng liên quan đến cache, naming/versioning file, và preload strategy.
- Nếu có nhiều phương án, chọn một phương án mặc định tốt nhất trước, rồi mới nêu phương án thay thế.

## Ghi chú tham chiếu kỹ thuật

- Supabase phân biệt cached egress và uncached egress; cached egress là dữ liệu được phục vụ từ cache/CDN.[cite:1]
- Supabase Storage docs hỗ trợ upload với các option như `cacheControl`.[cite:39][cite:42]
- Public URL có thể lấy bằng `getPublicUrl()`.[cite:48]
- Với file public, overwrite cùng URL có thể gây khó kiểm soát cache; versioning tên file thường an toàn hơn.[cite:34][cite:51]
- Nếu video có lượng xem lớn hoặc cần tua/xem theo phần hiệu quả hơn, adaptive streaming như HLS thường phù hợp hơn MP4 direct play.[cite:25][cite:27]

