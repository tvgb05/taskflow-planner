# Ke hoach cai thien cau truc code - TaskFlow Planner

Ngay review: 2026-07-11

## 1. Muc tieu cua ban review

Tai lieu nay danh gia cau truc hien tai cua TaskFlow Planner va de xuat lo trinh refactor theo tung buoc nho. Muc tieu la lam code de doc, de test va an toan khi them tinh nang, nhung van giu dung quy mo mot fullstack portfolio MVP.

Day khong phai ke hoach viet lai du an, cung khong de xuat ap dung Clean Architecture day du mot cach may moc.

Nguon nguyen tac tham chieu:

- [agent-rules-books](https://github.com/ciembor/agent-rules-books): repo khuyen nghi ban `mini` cho phan lon cong viec thuc te.
- [A Philosophy of Software Design - mini](https://github.com/ciembor/agent-rules-books/blob/main/a-philosophy-of-software-design/a-philosophy-of-software-design.mini.md): giam cognitive load, an chi tiet de thay doi va tranh module mong chi chuyen tiep du lieu.
- [Clean Architecture - mini](https://github.com/ciembor/agent-rules-books/blob/main/clean-architecture/clean-architecture.mini.md): business rule doc lap voi UI, HTTP, database va vendor ben ngoai.
- [Refactoring - mini](https://github.com/ciembor/agent-rules-books/blob/main/refactoring/refactoring.mini.md): refactor tung buoc nho, co test bao ve hanh vi truoc khi di chuyen code.
- [Release It! - mini](https://github.com/ciembor/agent-rules-books/tree/main/release-it): dat timeout, rate limit, quan sat loi va xu ly failure cho Gemini/Nodemailer.

## 2. Ket luan nhanh

Cau truc goc cua du an dang hop ly voi MVP:

- Monorepo tach ro `apps/web`, `apps/api`, `docs`, `scripts`.
- Laravel da co Form Request, API Resource va Service cho schedule/Gemini.
- Model relationship va ownership check da ton tai.
- Next.js da co UI component dung chung va type dung chung.
- Script phat trien tai root giup chay DB, API, web va mo browser cung luc.

Ba nut that lon nhat hien tai:

1. Khong co test nghiep vu thuc su. Hai test backend van la test mau cua Laravel, trong khi schedule, AI validation va ownership la cac luong co nhieu rule nhat.
2. `apps/web/src/app/projects/[id]/page.tsx` co 1.173 dong va dang so huu qua nhieu trach nhiem: fetch data, form state, CRUD, AI workflow, bulk save, scheduling, filter, guide va render.
3. Luu goi y AI la mot chuoi request tu frontend. Neu request thu N that bai, mot phan task/subtask da duoc luu va khong co rollback.

Khuyen nghi: uu tien tao safety net va sua bien giao dich truoc, sau do moi tach frontend/backend theo feature.

## 3. Danh gia chi tiet theo muc uu tien

### P0 - Can xu ly truoc khi mo rong tinh nang

#### P0.1. Thieu test bao ve business rule

Bang chung:

- `apps/api/tests/Feature/ExampleTest.php` chi kiem tra route `/` tra ve 200.
- `apps/api/tests/Unit/ExampleTest.php` chi kiem tra `true === true`.
- Chua co test frontend cho API client, hooks hoac workflow quan trong.

Rui ro:

- Refactor schedule co the lam sai thu tu priority, capacity hoac deadline ma lint/build van pass.
- Ownership regression co the cho phep user A doc/sua du lieu cua user B.
- Gemini response sai schema hoac vuot budget co the duoc chap nhan ngoai y muon.

De xuat test toi thieu:

- Feature: register/login/logout/current user.
- Feature: project/task/subtask CRUD va ownership 403 giua hai user.
- Unit: schedule sap priority dung, chia tai theo ngay, khong vuot capacity, deadline qua han, subtask qua lon.
- Unit: AI budget, min/max task, enable/disable subtask, ngay nam trong cua so deadline, JSON sai schema.
- Feature: generate schedule chi thay doi subtask cua project thuoc user hien tai.
- Frontend: `apiRequest` xu ly 2xx, validation 422, 401, response rong va response khong phai JSON.

Definition of done:

- Xoa hai `ExampleTest` hoac thay bang test co y nghia.
- `composer test`/`php artisan test`, frontend lint va build chay trong mot lenh root.

#### P0.2. Bulk save AI khong atomic

Bang chung:

- `saveAiSuggestions()` trong project detail tao tung task, sau do tao tung subtask bang cac request rieng.
- Backend chua co endpoint xac nhan/lau goi y AI theo mot transaction.

Rui ro:

- Mat mang hoac validation fail o giua luong de lai du lieu nua chung.
- Retry tu UI co the tao task trung.
- Frontend phai biet trinh tu persistence cua backend, lam lo chi tiet noi bo qua API boundary.

De xuat:

- Them endpoint `POST /api/projects/{project}/ai-breakdown/confirm`.
- Request nhan toan bo danh sach task/subtask da duoc nguoi dung chinh sua.
- Backend validate lai payload va deadline, sau do luu bang `DB::transaction()`.
- Response tra ve `ProjectResource` da refresh.
- Co the them `client_request_id` de chong double submit; chua can lam ngay neu UI khoa nut trong luc submit.

#### P0.3. Schedule update can transaction va concurrency guard

Bang chung:

- `ScheduleGeneratorService` tinh assignment trong memory roi goi `update()` tung subtask.
- Khong co transaction; hai request generate schedule dong thoi co the ghi de nhau.

De xuat:

- Tach ham tinh lich thanh pure planner, khong ghi DB.
- Application action mo transaction, lock cac subtask can lap lich, goi planner, sau do bulk update.
- Neu giu Eloquent update tung dong o quy mo MVP, van phai boc toan bo write trong transaction.

#### P0.4. Endpoint ton chi phi chua co rate limit

Can them throttle rieng cho:

- Login va register.
- Gui lai email xac thuc.
- Gemini AI breakdown.

Gemini va Nodemailer la external dependency: can timeout ro rang, log co request context, khong log secret, va retry gioi han chi cho loi tam thoi.

### P1 - Giam do phuc tap va lam ro ownership

#### P1.1. Tach project detail thanh feature modules

Hien tai `projects/[id]/page.tsx` co 1.173 dong, 17+ state groups/handlers va hai cach load project bi lap. Route component dang la controller, service va view cung luc.

Cau truc de xuat:

```txt
apps/web/src/
|-- app/
|   `-- projects/[id]/page.tsx          # chi compose feature sections
|-- features/
|   |-- projects/
|   |   |-- api/project-api.ts
|   |   |-- hooks/use-project-detail.ts
|   |   `-- components/
|   |       |-- ProjectHeader.tsx
|   |       |-- ProjectEditForm.tsx
|   |       `-- ProjectFilters.tsx
|   |-- tasks/
|   |   |-- api/task-api.ts
|   |   `-- components/TaskList.tsx
|   |-- scheduling/
|   |   |-- api/schedule-api.ts
|   |   `-- components/SchedulePanel.tsx
|   `-- ai-breakdown/
|       |-- api/ai-breakdown-api.ts
|       |-- hooks/use-ai-breakdown.ts
|       `-- components/AiBreakdownModal.tsx
|-- components/ui/                       # primitive UI dung chung
`-- lib/                                  # ha tang dung chung: api, auth, i18n
```

Nguyen tac tach:

- Tach theo feature/use case, khong tach chi vi file dai.
- Hook so huu state va sequence cua mot workflow; component so huu render va interaction cuc bo.
- `page.tsx` khong tu ghep body HTTP va khong biet trinh tu tao task/subtask.
- Khong tao mot thu muc `helpers` hoac `services` chung chung.

#### P1.2. Giam kich thuoc cac component da gom nhieu vai tro

Ung vien tiep theo:

- `TaskCard.tsx`: 542 dong, gom task editor, create subtask va subtask editor.
- `dashboard/page.tsx`: 471 dong, gom aggregation, mutations, lists va modal detail.
- `AppShell.tsx`: 396 dong, gom auth guard, navigation, logout, settings va profile verification.
- `i18n.ts`: 600 dong, ca schema va noi dung hai ngon ngu trong mot file.

De xuat:

- Tach `TaskCard`, `TaskEditForm`, `SubtaskList`, `SubtaskEditor`; giu state edit gan component so huu form.
- Tao `useDashboardData()` hoac dashboard endpoint thay vi aggregate moi thu truc tiep trong page.
- Tach `SettingsMenu` va `ProfileSettingsForm` khoi AppShell.
- Tach `locales/en.ts`, `locales/vi.ts`; giu type/lookup trong `i18n.ts`.

#### P1.3. Bien ownership thanh policy thay vi private method lap lai

Hien tai ownership duoc kiem tra dung, nhung logic lap trong Project, Task, Subtask, Schedule va AI controller.

De xuat:

- Tao `ProjectPolicy`, `TaskPolicy`, `SubtaskPolicy`.
- Controller goi `$this->authorize('update', $task)` hoac dung `authorizeResource` khi phu hop.
- Can nhac scoped bindings cho nested routes, nhung khong dung scoped binding thay cho authorization theo user.

Loi ich: mot noi duy nhat dinh nghia ownership va co the test truc tiep.

#### P1.4. Tach orchestration khoi vendor Gemini

`GeminiTaskBreakdownService` dang gom:

- Tinh capacity con lai.
- Tao prompt.
- Goi HTTP Gemini.
- Decode/validate schema.
- Chuan hoa estimate.
- Can bang ngay cho subtask.

Khong nen tach thanh nhieu class mong. Mot bien hop ly cho MVP:

```txt
app/
|-- Actions/Projects/SuggestProjectTasks.php       # orchestration/use case
|-- Services/Ai/GeminiClient.php                  # HTTP + vendor response
|-- Services/Planning/SuggestionPlanner.php       # budget + normalize dates
`-- Data/AiTaskSuggestionData.php                 # boundary data neu can
```

`SuggestionPlanner` nen test duoc ma khong can Laravel HTTP fake hay Gemini key. Gemini client duoc test rieng bang `Http::fake()`.

#### P1.5. Tach pure scheduling policy khoi Eloquent persistence

Muc tieu khong phai loai Eloquent khoi app, ma de business rule lich chay duoc bang array/value object don gian:

```txt
ScheduleController
  -> GenerateProjectSchedule action
      -> SchedulePlanner (pure rule)
      -> Eloquent load/transaction/save
```

Planner nhan deadline, daily capacity va danh sach work item; tra assignment hoac domain error. Clock (`today`) nen duoc truyen vao de test khong phu thuoc ngay may tinh.

#### P1.6. Dinh nghia invariant lien quan deadline va status

Hien tai validation kiem tra type/range nhung chua the hien day du rule lien entity.

Can chot va test cac rule sau:

- Task deadline co duoc sau project deadline khong? Khuyen nghi: khong.
- Subtask scheduled date co duoc sau task/project deadline khong? Khuyen nghi: khong.
- Project deadline co duoc nam trong qua khu khi create/update khong?
- Mark task done co tu dong mark subtask done khong, hay chi cho done khi moi subtask da done?
- Sua project deadline ngan hon co xu ly cac ngay da schedule nhu the nao?

Dat rule trong action/domain planner, khong chi dat o frontend.

### P2 - Hieu nang, contract va maintainability

#### P2.1. Tranh tai toan bo object graph cho moi man hinh

`GET /projects` dang eager-load `tasks.subtasks` cho project list va dashboard. Cach nay don gian cho MVP nhung payload tang nhanh theo so project.

De xuat khi data bat dau lon:

- Project list chi tra summary/count/progress.
- Project detail moi tra tasks/subtasks.
- Dashboard co endpoint/read model rieng cho metrics, due tasks va today's subtasks.
- Them pagination cho project/task list.

Chua can lam truoc P0/P1.

#### P2.2. Lam API contract ro hon

Frontend dang lap `T | { data: T }` va goi `unwrapResource()` o nhieu noi. Day la dau hieu response shape chua nhat quan.

De xuat:

- Chon mot contract duy nhat cho resource/collection va giu no o tat ca endpoint.
- Tao API function theo feature de component khong lap path/method/body mapping.
- Them OpenAPI sau khi endpoint on dinh; co the generate type/client sau, nhung chua can them toolchain nang ngay.
- `apiRequest` can xu ly response khong phai JSON, 204, abort/timeout va 401 mot cach co chu dich.

#### P2.3. Chot chien luoc auth cho production demo

Token hien luu trong `localStorage`. Cach nay de demo, nhung token co the bi doc neu co XSS.

Hai lua chon hop ly:

- Portfolio local/demo: giu bearer token, ghi ro trade-off va them CSP/co che escape noi dung.
- Deploy public: chuyen sang Sanctum SPA cookie HttpOnly, CSRF va credentialed requests.

Khong nen tron ca hai flow.

#### P2.4. Cap nhat tai lieu dang bi drift

`docs/api.md` van mo ta AI response cu la `subtasks`, trong khi code hien tai tra `tasks` long `subtasks`. Tai lieu cung chua co:

- Project `icon`.
- Subtask `description`.
- Task/subtask AI settings va `scheduled_date`.
- Update profile va email verification endpoints.
- Nodemailer environment variables.

`docs/database.md` cung chua co project icon va subtask description. README van chi co screenshot placeholder.

## 4. Cau truc backend dich de xuat

Khong can chuyen toan bo Laravel sang mot kien truc nhieu layer. Chi tao boundary tai noi co business rule hoac external dependency:

```txt
apps/api/app/
|-- Actions/
|   |-- Projects/ConfirmAiSuggestions.php
|   `-- Scheduling/GenerateProjectSchedule.php
|-- Data/
|   `-- AiTaskSuggestionData.php             # optional, chi them neu giam mapping ro ret
|-- Http/
|   |-- Controllers/Api/
|   |-- Requests/
|   `-- Resources/
|-- Models/
|-- Policies/
|   |-- ProjectPolicy.php
|   |-- TaskPolicy.php
|   `-- SubtaskPolicy.php
`-- Services/
    |-- Ai/GeminiClient.php
    `-- Planning/
        |-- SchedulePlanner.php
        `-- SuggestionPlanner.php
```

Controller chi nen lam bon viec: authorize, nhan validated input, goi action, tra resource/response.

## 5. Lo trinh refactor theo PR nho

### PR 1 - Safety net va quality gate

- Them factory cho Project/Task/Subtask.
- Them ownership feature tests.
- Them schedule unit tests va AI validation tests.
- Them root script `test` va `check` (`test + lint + build`).
- Chua di chuyen production code neu test chua mo ta duoc behavior hien tai.

### PR 2 - Atomic AI confirmation

- Them confirm request va endpoint.
- Backend save task/subtask trong transaction.
- Frontend dung mot request confirm.
- Test rollback khi mot subtask invalid.

### PR 3 - Scheduling boundary

- Extract pure `SchedulePlanner` voi `today` duoc truyen vao.
- Action xu ly Eloquent transaction/persistence.
- Giu response API hien tai de khong lam vo frontend.

### PR 4 - Authorization va abuse protection

- Them policies va thay ownership method lap lai.
- Them throttle cho auth, verification va Gemini.
- Them timeout/structured log cho Nodemailer.

### PR 5 - Tach project detail frontend

- Extract API functions theo feature.
- Extract AI modal/hook truoc vi day la workflow doc lap lon nhat.
- Extract project form, task list va schedule panel.
- Giu route page la composition root khoang 100-200 dong; khong dat hard limit neu viec tach lam tang so lan nhay file.

### PR 6 - Dashboard, AppShell va i18n

- Tach Settings/Profile khoi AppShell.
- Tach dashboard rows/modal va data hook.
- Tach locale `en`/`vi`.

### PR 7 - Contract, docs va portfolio polish

- Chuan hoa API envelope.
- Cap nhat `docs/api.md`, `docs/database.md`, `docs/setup.md`.
- Them screenshot that va architecture diagram nho vao README.
- Them CI chay backend test, frontend lint va build.

## 6. Nhung viec khong nen lam luc nay

- Khong tach microservice cho AI, email hoac scheduling.
- Khong them repository interface cho moi Eloquent model neu khong co nhu cau thay persistence/testability cu the.
- Khong tao BaseController, BaseService, generic CRUD service hay `utils` tong hop.
- Khong them event bus/queue chi de tao task va subtask; queue chi hop ly cho email hoac job AI dai khi co nhu cau thuc.
- Khong viet lai toan bo frontend bang state-management library. Local state va feature hooks la du cho quy mo hien tai.
- Khong refactor UI va thay doi behavior lon trong cung mot PR.

## 7. Tieu chi danh gia sau khi cai thien

Ban refactor dat yeu cau khi:

- Business rule schedule va AI co test chay khong can mang that.
- Ownership cua Project/Task/Subtask duoc dinh nghia mot lan va co test 403.
- Confirm AI hoac generate schedule that bai khong de lai du lieu nua chung.
- Route page frontend chu yeu compose feature, khong chua persistence workflow chi tiet.
- Gemini/Nodemailer failure co timeout, status phu hop va log du de debug ma khong lo secret.
- API docs khop voi response thuc te.
- Mot developer moi co the tim thay code theo use case: project, task, scheduling, AI breakdown.
- Moi PR nho, giu behavior quan sat duoc va co cach rollback doc lap.

## 8. Thu tu uu tien de review/quyet dinh

De bat dau, chi can chot bon quyet dinh:

1. Dong y tao endpoint confirm AI atomic hay tiep tuc luu tung request tu frontend.
2. Dong y behavior cua task/subtask khi mark done va khi deadline bi rut ngan.
3. Demo se giu bearer token localStorage hay huong den deploy public bang Sanctum cookie.
4. Muc coverage toi thieu cho MVP: khuyen nghi uu tien test business rule va authorization thay vi chay theo phan tram tong.

Sau khi chot bon diem nay, co the thuc hien PR 1-4 ma khong can thay doi giao dien nguoi dung.
