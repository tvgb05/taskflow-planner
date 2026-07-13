"use client";

import { type AppLanguage, usePreferences } from "@/lib/preferences";

export const appText = {
  en: {
    common: {
      add: "Add",
      all: "All",
      back: "Back",
      cancel: "Cancel",
      createProject: "Create project",
      delete: "Delete",
      done: "Done",
      due: "Due",
      guide: "Guide",
      loading: "Loading",
      minutes: "minutes",
      min: "min",
      minPerDay: "min/day",
      newProject: "New project",
      noDate: "No date",
      noDescription: "No description",
      priority: "Priority",
      projects: "Projects",
      reset: "Reset",
      saveChanges: "Save changes",
      status: "Status",
      title: "Title",
    },
    status: {
      todo: "Todo",
      in_progress: "In progress",
      done: "Done",
    },
    priority: {
      low: "Low",
      medium: "Medium",
      high: "High",
    },
    appShell: {
      checkingSession: "Checking session",
      dashboard: "Dashboard",
      logout: "Logout",
      settings: "Settings",
      preferences: "Preferences",
      savedOnBrowser: "Saved on this browser",
      profileDescription: "Update your account name, email, and verification.",
      name: "Name",
      email: "Email",
      emailVerified: "Email verified",
      emailUnverified: "Email not verified",
      sendVerificationEmail: "Send code",
      verificationEmailSent: "Verification code sent.",
      verificationEmailUnavailable:
        "Verification code was not sent. Check Nodemailer configuration.",
      profileSaved: "Profile saved.",
      profileSavedVerificationSent:
        "Profile saved. A new verification code was sent.",
      profileSavedVerificationUnavailable:
        "Profile saved, but the verification code was not sent. Check Nodemailer configuration.",
      profileSaveError: "Unable to save profile.",
      verificationEmailError: "Unable to send verification code.",
      verificationOtp: "Verification code",
      verifyOtp: "Verify",
      verificationOtpSuccess: "Email verified successfully.",
      verificationOtpError: "Unable to verify this code.",
      language: "Language",
      dateFormat: "Date format",
      english: "English",
      vietnamese: "Vietnamese",
      profile: "Profile",
    },
    guide: {
      step: (current: number, total: number) => `Step ${current} of ${total}`,
      close: "Close guide",
      next: "Next",
      done: "Done",
      dashboardSteps: [
        {
          title: "Create your first project",
          description:
            "Start here when you have a goal, deadline, and daily time budget.",
          details: [
            "Click New project.",
            "Add a goal name, deadline, and minutes per day.",
            "Use Description as the AI brief: explain the target user, scope, required features, tech constraints, and what done should look like.",
          ],
        },
        {
          title: "Read the dashboard",
          description:
            "These counters summarize workload, upcoming deadlines, active tasks, and today's plan.",
        },
        {
          title: "Follow current work",
          description:
            "Use these panels to spot near deadlines and subtasks scheduled for today.",
        },
      ],
      newProjectSteps: [
        {
          title: "Name the outcome",
          description:
            "Use the project name as a short promise of what you want to finish.",
          details: [
            "Prefer concrete names like Portfolio planner MVP over vague study app.",
            "The name helps you recognize the project in dashboards and schedules.",
          ],
        },
        {
          title: "Write the AI brief",
          description:
            "Description is the context AI uses later when it suggests tasks.",
          details: [
            "Say who will use it and what problem it solves.",
            "List core screens, required features, API/data needs, and tech constraints.",
            "Describe what demo-ready done should look like.",
          ],
        },
        {
          title: "Set the planning budget",
          description:
            "Deadline and minutes per day become the hard schedule budget.",
          details: [
            "AI suggestions must fit inside this original deadline window.",
            "Schedule generation uses the same daily capacity.",
          ],
        },
        {
          title: "Create and review",
          description:
            "Save the project, then review AI suggestions before saving them as tasks.",
          details: [
            "Saved AI tasks can be expanded, edited, and checked with their subtasks.",
          ],
        },
      ],
      projectSteps: [
        {
          title: "Confirm the project frame",
          description:
            "This is the goal contract: deadline and daily capacity shape every schedule.",
          details: [
            "Keep the description concrete because AI suggestions reuse it as context.",
            "Mention target user, core screens, API/data needs, and demo-ready outcome.",
            "Use a deadline you can demo against.",
          ],
        },
        {
          title: "Use AI as a draft",
          description:
            "AI breakdown suggests work items, but you review them before saving.",
          details: [
            "The key stays on Laravel.",
            "Generated schedule is deterministic Laravel logic.",
          ],
        },
        {
          title: "Add task details",
          description:
            "Tasks carry priority and deadline. Subtasks carry scheduled dates and done state.",
        },
        {
          title: "Work from the plan",
          description:
            "Filter tasks on the left and inspect the scheduled days on the right.",
        },
      ],
      aiSuggestSteps: [
        {
          title: "Describe the result",
          description:
            "Give the assistant enough context to turn the project into practical work.",
          details: [
            "State the result you need, important constraints, and what completed work should look like.",
            "Add concrete requirements instead of relying on the project name alone.",
          ],
        },
        {
          title: "Choose the AI profile and response",
          description:
            "The profile changes the kind of work suggested; the response style changes how much explanation you receive.",
          details: [
            "Choose the profile closest to this project's purpose.",
            "Detailed is a strong default when you need actionable instructions.",
          ],
        },
        {
          title: "Choose a planning mode",
          description:
            "Use phases for a one-time project, weekly repetition for routines, or next-day planning when feedback should guide each day.",
        },
        {
          title: "Control the amount of work",
          description:
            "Set task and subtask limits so the draft stays useful and fits the project deadline.",
          details: [
            "Tasks should represent meaningful outcomes; subtasks should explain the concrete steps.",
            "Disable subtasks only when you want a high-level plan.",
          ],
        },
        {
          title: "Generate, review, then save",
          description:
            "Create a draft and review every task before adding it to the project.",
          details: [
            "Use Revise with AI on any task that is unclear or unsuitable.",
            "Save suggestions only after deadlines, descriptions, and scheduled steps look right.",
          ],
        },
      ],
    },
    dashboard: {
      title: "Dashboard",
      description:
        "A compact view of current project load, deadlines, and scheduled work.",
      loadError: "Unable to load dashboard data.",
      loading: "Loading dashboard",
      projects: "Projects",
      dueSoon: "Due soon",
      inProgress: "In progress",
      today: "Today",
      tasksDueSoon: "Tasks due soon",
      todayScheduledSubtasks: "Today scheduled subtasks",
      noSubtasksToday: "No subtasks scheduled today",
      projectProgress: "Project progress",
      noUpcomingTaskDeadlines: "No upcoming task deadlines",
      completeTask: "Mark task complete",
      reopenTask: "Reopen task",
      taskDetails: "Task details",
    },
    projects: {
      title: "Projects",
      description:
        "Plan goals, track progress, and schedule subtasks before deadlines.",
      loadError: "Unable to load projects.",
      loading: "Loading projects",
      emptyTitle: "No projects yet",
      emptyDescription: "Create a project with a deadline and daily capacity.",
      openProject: "Open project",
    },
    newProject: {
      title: "New project",
      description: "Set the goal, deadline, and daily planning capacity.",
      projectName: "Project name",
      descriptionLabel: "Description",
      descriptionPlaceholder:
        "Example: Build a portfolio task planner for students with auth, projects, AI task breakdown, schedule generation, and a demo-ready dashboard.",
      deadline: "Deadline",
      availableMinutes: "Available minutes per day",
      saveProject: "Save project",
      createError: "Unable to create project.",
    },
    project: {
      fallbackTitle: "Project",
      fallbackDescription: "Project workspace",
      loading: "Loading project",
      projectInformation: "Project information",
      name: "Name",
      icon: "Project icon",
      description: "Description",
      deadline: "Deadline",
      minutesPerDay: "Minutes per day",
      schedule: "Schedule",
      generateSchedule: "Generate schedule",
      refreshSchedule: "Refresh schedule",
      aiBreakdown: "AI breakdown",
      aiCallout: "Turn the project goal into detailed tasks and scheduled subtasks.",
      aiSettings: "AI settings",
      planningProfile: "AI profile",
      portfolio: "Portfolio builder",
      study: "Study planner",
      work: "Work sprint",
      personal: "Personal goals",
      aiStyle: "Response style",
      concise: "Concise",
      detailed: "Detailed",
      coach: "Coach",
      planMode: "Planning mode",
      phasedPlan: "Phased plan",
      recurringPlan: "Recurring weekly plan",
      pipelinePlan: "Next-day pipeline",
      recurrenceCycles: "Weekly cycles",
      feedback: "Feedback for the next day",
      feedbackHint: "Tell the AI what worked, what was difficult, or what must change next.",
      phase: "Phase",
      taskSettings: "Task settings",
      minTasks: "Min tasks",
      maxTasks: "Max tasks",
      subtaskSettings: "Subtask settings",
      createSubtasksOnSave: "Create subtasks when saving",
      minSubtasks: "Min subtasks",
      maxSubtasks: "Max subtasks",
      scheduleAfterSaving: "Schedule after saving",
      newTask: "New task",
      minutes: "Minutes",
      addTask: "Add task",
      dueBefore: "Due before",
      noTasksMatch: "No tasks match",
      noTasksDescription: "Adjust filters or add a task to this project.",
      scheduleView: "Schedule view",
      goal: "Goal",
      generateSuggestions: "Generate suggestions",
      saveSuggestions: "Save suggestions",
      repromptTask: "Revise with AI",
      repromptLabel: "What should change?",
      repromptPlaceholder:
        "Example: Make this task more practical, reduce the scope, and add clearer setup steps.",
      applyReprompt: "Generate replacement",
      repromptError: "Unable to revise this task.",
      aiGeneratedDescription: "AI-generated suggestion awaiting review.",
      noTaskDeadline: "No task deadline",
      noSubtasksYet: "No subtasks yet.",
      subtasks: "subtasks",
      editTask: "Edit task",
      taskDetails: "Task details",
      expandTask: "Open task details",
      collapseTask: "Close task details",
      scheduled: "Scheduled",
      subtask: "Subtask",
      date: "Date",
      addSubtask: "Add subtask",
      designProjectForm: "Design project form",
      requestAiError: "Unable to request AI suggestions.",
      saveAiError: "Unable to save suggestions.",
      autoScheduleError: "Suggestions were saved, but the schedule could not be refreshed.",
      loadProjectError: "Unable to load project.",
      updateProjectError: "Unable to update project.",
      deleteProjectError: "Unable to delete project.",
      deleteProjectTitle: "Delete project?",
      deleteProjectWarning: "This action cannot be undone.",
      deleteProjectDescription:
        "The project, all of its tasks, subtasks, and schedule data will be permanently deleted.",
      deletingProject: "Deleting...",
      createTaskError: "Unable to create task.",
      updateTaskError: "Unable to update task.",
      deleteTaskError: "Unable to delete task.",
      createSubtaskError: "Unable to create subtask.",
      updateSubtaskError: "Unable to update subtask.",
      deleteSubtaskError: "Unable to delete subtask.",
      generateScheduleError: "Unable to generate schedule.",
    },
    schedule: {
      emptyTitle: "No scheduled subtasks",
      emptyDescription:
        "Generate a schedule after adding incomplete subtasks.",
    },
    modal: {
      close: "Close",
    },
    auth: {
      loginSubtitle: "Sign in to your workspace.",
      email: "Email",
      password: "Password",
      login: "Login",
      needAccount: "Need an account?",
      register: "Register",
      createAccount: "Create account",
      registerSubtitle: "Start planning projects with tasks and subtasks.",
      name: "Name",
      confirmPassword: "Confirm password",
      otp: "Email verification code",
      sendOtp: "Send code",
      sendOtpCountdown: "Resend in",
      otpSent: "A 6-digit code was sent to your email.",
      checkMailFolders:
        "Please check every mail folder, including Spam and Trash, for your verification code.",
      otpSendError: "Unable to send the verification code.",
      alreadyHaveAccount: "Already have an account?",
      apiError: "Unable to reach the API.",
    },
  },
  vi: {
    common: {
      add: "Thêm",
      all: "Tất cả",
      back: "Quay lại",
      cancel: "Hủy",
      createProject: "Tạo dự án",
      delete: "Xóa",
      done: "Xong",
      due: "Hạn",
      guide: "Hướng dẫn",
      loading: "Đang tải",
      minutes: "phút",
      min: "phút",
      minPerDay: "phút/ngày",
      newProject: "Dự án mới",
      noDate: "Chưa có ngày",
      noDescription: "Chưa có mô tả",
      priority: "Độ ưu tiên",
      projects: "Dự án",
      reset: "Đặt lại",
      saveChanges: "Lưu thay đổi",
      status: "Trạng thái",
      title: "Tiêu đề",
    },
    status: {
      todo: "Cần làm",
      in_progress: "Đang làm",
      done: "Hoàn tất",
    },
    priority: {
      low: "Thấp",
      medium: "Vừa",
      high: "Cao",
    },
    appShell: {
      checkingSession: "Đang kiểm tra phiên đăng nhập",
      dashboard: "Tổng quan",
      logout: "Đăng xuất",
      settings: "Cài đặt",
      preferences: "Tùy chọn",
      savedOnBrowser: "Lưu trên trình duyệt này",
      profileDescription: "Cập nhật tên, email và trạng thái xác thực.",
      name: "Tên",
      email: "Email",
      emailVerified: "Email đã xác thực",
      emailUnverified: "Email chưa xác thực",
      sendVerificationEmail: "Gửi mã",
      verificationEmailSent: "Đã gửi mã xác thực.",
      verificationEmailUnavailable:
        "Chưa gửi được mã xác thực. Vui lòng thử lại sau.",
      profileSaved: "Đã lưu hồ sơ.",
      profileSavedVerificationSent:
        "Đã lưu hồ sơ. Mã xác thực mới đã được gửi.",
      profileSavedVerificationUnavailable:
        "Đã lưu hồ sơ, nhưng chưa gửi được mã xác thực. Vui lòng thử lại sau.",
      profileSaveError: "Không lưu được hồ sơ.",
      verificationEmailError: "Không gửi được mã xác thực.",
      verificationOtp: "Mã xác thực",
      verifyOtp: "Xác thực",
      verificationOtpSuccess: "Email đã được xác thực.",
      verificationOtpError: "Không thể xác thực mã này.",
      language: "Ngôn ngữ",
      dateFormat: "Định dạng ngày tháng",
      english: "Tiếng Anh",
      vietnamese: "Tiếng Việt",
      profile: "Hồ sơ",
    },
    guide: {
      step: (current: number, total: number) => `Bước ${current}/${total}`,
      close: "Đóng hướng dẫn",
      next: "Tiếp",
      done: "Hoàn tất",
      dashboardSteps: [
        {
          title: "Tạo dự án đầu tiên",
          description:
            "Bắt đầu ở đây khi bạn có mục tiêu, hạn chót và quỹ thời gian mỗi ngày.",
          details: [
            "Bấm Dự án mới.",
            "Nhập tên mục tiêu, hạn chót và số phút có thể dành ra mỗi ngày.",
            "Trong phần Mô tả, hãy ghi rõ người sử dụng, phạm vi, tính năng cần có, các giới hạn và kết quả được xem là hoàn thành để trợ lý hiểu đúng yêu cầu.",
          ],
        },
        {
          title: "Đọc trang tổng quan",
          description:
            "Các chỉ số này tóm tắt khối lượng công việc, hạn chót gần tới, nhiệm vụ đang làm và kế hoạch hôm nay.",
        },
        {
          title: "Theo dõi việc hiện tại",
          description:
            "Dùng các khung này để xem nhiệm vụ gần tới hạn và các bước thực hiện đã lên lịch cho hôm nay.",
        },
      ],
      newProjectSteps: [
        {
          title: "Đặt tên kết quả",
          description:
            "Tên dự án nên mô tả ngắn gọn kết quả bạn muốn hoàn thành.",
          details: [
            "Ưu tiên tên cụ thể như Hoàn thành hồ sơ năng lực cá nhân thay vì Ứng dụng học tập chung chung.",
            "Tên này giúp bạn dễ nhận ra dự án trên trang tổng quan và lịch làm.",
          ],
        },
        {
          title: "Mô tả yêu cầu cho trợ lý",
          description:
            "Phần mô tả là thông tin trợ lý sẽ dùng khi gợi ý các nhiệm vụ.",
          details: [
            "Ghi rõ ai sẽ sử dụng và ứng dụng cần giải quyết vấn đề gì.",
            "Liệt kê các màn hình chính, tính năng bắt buộc, nhu cầu kết nối dữ liệu và những giới hạn cần tuân thủ.",
            "Mô tả rõ kết quả nào được xem là hoàn thành và có thể chạy thử.",
          ],
        },
        {
          title: "Chốt quỹ thời gian",
          description:
            "Hạn chót và số phút mỗi ngày sẽ quyết định lịch thực hiện.",
          details: [
            "Các gợi ý phải nằm trong khoảng thời gian đã chọn.",
            "Tạo lịch cũng dùng đúng sức chứa mỗi ngày này.",
          ],
        },
        {
          title: "Tạo rồi rà lại",
          description:
            "Lưu dự án, sau đó xem lại các gợi ý trước khi lưu thành nhiệm vụ.",
          details: [
            "Bạn có thể mở, chỉnh sửa và kiểm tra từng nhiệm vụ cùng các bước thực hiện bên trong.",
          ],
        },
      ],
      projectSteps: [
        {
          title: "Kiểm tra thông tin dự án",
          description:
            "Hạn chót và thời lượng mỗi ngày trong phần này sẽ quyết định lịch làm.",
          details: [
            "Viết mô tả cụ thể vì trợ lý sẽ dùng phần này để hiểu mục tiêu.",
            "Nêu rõ người sử dụng, các màn hình chính, nhu cầu kết nối dữ liệu và kết quả có thể chạy thử.",
            "Chọn hạn chót phù hợp với thời gian bạn có.",
          ],
        },
        {
          title: "Dùng trợ lý để tạo bản nháp",
          description:
            "Trợ lý sẽ chia nhỏ công việc, nhưng bạn vẫn nên xem lại trước khi lưu.",
          details: [
            "Thông tin kết nối của trợ lý được bảo vệ ở máy chủ.",
            "Lịch làm được kiểm tra để không vượt quá thời gian của dự án.",
          ],
        },
        {
          title: "Thêm chi tiết nhiệm vụ",
          description:
            "Mỗi nhiệm vụ có độ ưu tiên và hạn chót. Các bước thực hiện có ngày làm và trạng thái hoàn tất.",
        },
        {
          title: "Làm việc theo kế hoạch",
          description:
            "Lọc nhiệm vụ bên trái và xem các ngày đã được lên lịch ở bên phải.",
        },
      ],
      aiSuggestSteps: [
        {
          title: "Mô tả kết quả cần đạt",
          description:
            "Cung cấp đủ thông tin để trợ lý biến dự án thành các công việc thực tế.",
          details: [
            "Nêu kết quả cần có, các giới hạn quan trọng và thế nào được xem là hoàn thành.",
            "Ghi yêu cầu cụ thể thay vì chỉ dựa vào tên dự án.",
          ],
        },
        {
          title: "Chọn hồ sơ và cách trả lời",
          description:
            "Hồ sơ quyết định loại công việc được đề xuất; cách trả lời quyết định mức độ giải thích của trợ lý.",
          details: [
            "Chọn hồ sơ gần nhất với mục đích của dự án này.",
            "Chi tiết là lựa chọn phù hợp khi bạn cần chỉ dẫn có thể làm theo ngay.",
          ],
        },
        {
          title: "Chọn cách lập kế hoạch",
          description:
            "Chọn theo giai đoạn cho dự án làm một lần, lặp theo tuần cho thói quen, hoặc từng ngày khi phản hồi mỗi ngày cần được ưu tiên.",
        },
        {
          title: "Giới hạn khối lượng công việc",
          description:
            "Đặt số nhiệm vụ và bước thực hiện để bản nháp vừa hữu ích, vừa nằm trong hạn chót của dự án.",
          details: [
            "Nhiệm vụ nên là kết quả lớn; các bước thực hiện nên mô tả việc cụ thể cần làm.",
            "Chỉ tắt các bước thực hiện khi bạn muốn một kế hoạch khái quát.",
          ],
        },
        {
          title: "Tạo, xem lại rồi lưu",
          description:
            "Tạo bản nháp và kiểm tra từng nhiệm vụ trước khi thêm vào dự án.",
          details: [
            "Dùng nút Nhờ trợ lý sửa với nhiệm vụ chưa rõ hoặc chưa phù hợp.",
            "Chỉ lưu khi hạn chót, nội dung và ngày làm của các bước đã hợp lý.",
          ],
        },
      ],
    },
    dashboard: {
      title: "Tổng quan",
      description:
        "Thông tin ngắn gọn về khối lượng công việc, hạn chót và các việc đã lên lịch.",
      loadError: "Không tải được dữ liệu tổng quan.",
      loading: "Đang tải tổng quan",
      projects: "Dự án",
      dueSoon: "Sắp tới hạn",
      inProgress: "Đang làm",
      today: "Hôm nay",
      tasksDueSoon: "Nhiệm vụ sắp tới hạn",
      todayScheduledSubtasks: "Các bước thực hiện hôm nay",
      noSubtasksToday: "Hôm nay chưa có bước thực hiện nào",
      projectProgress: "Tiến độ dự án",
      noUpcomingTaskDeadlines: "Chưa có nhiệm vụ nào sắp tới hạn",
      completeTask: "Đánh dấu nhiệm vụ hoàn tất",
      reopenTask: "Mở lại nhiệm vụ",
      taskDetails: "Chi tiết nhiệm vụ",
    },
    projects: {
      title: "Dự án",
      description:
        "Lập mục tiêu, theo dõi tiến độ và lên lịch các bước thực hiện trước hạn chót.",
      loadError: "Không tải được danh sách dự án.",
      loading: "Đang tải dự án",
      emptyTitle: "Chưa có dự án",
      emptyDescription: "Tạo dự án với hạn chót và thời lượng mỗi ngày.",
      openProject: "Mở dự án",
    },
    newProject: {
      title: "Dự án mới",
      description: "Thiết lập mục tiêu, hạn chót và quỹ thời gian mỗi ngày.",
      projectName: "Tên dự án",
      descriptionLabel: "Mô tả",
      descriptionPlaceholder:
        "Ví dụ: Xây dựng ứng dụng lập kế hoạch cho sinh viên, có đăng nhập, quản lý dự án, trợ lý chia nhỏ công việc, tạo lịch và trang tổng quan có thể chạy thử.",
      deadline: "Hạn chót",
      availableMinutes: "Số phút mỗi ngày",
      saveProject: "Lưu dự án",
      createError: "Không tạo được dự án.",
    },
    project: {
      fallbackTitle: "Dự án",
      fallbackDescription: "Khu vực làm việc của dự án",
      loading: "Đang tải dự án",
      projectInformation: "Thông tin dự án",
      name: "Tên",
      icon: "Biểu tượng dự án",
      description: "Mô tả",
      deadline: "Hạn chót",
      minutesPerDay: "Phút mỗi ngày",
      schedule: "Lịch",
      generateSchedule: "Tạo lịch",
      refreshSchedule: "Làm mới lịch",
      aiBreakdown: "Trợ lý chia nhỏ công việc",
      aiCallout: "Biến mục tiêu dự án thành các nhiệm vụ chi tiết và bước thực hiện có ngày làm.",
      aiSettings: "Cài đặt trợ lý",
      planningProfile: "Hồ sơ trợ lý",
      portfolio: "Xây dựng hồ sơ năng lực",
      study: "Kế hoạch học tập",
      work: "Đợt công việc ngắn",
      personal: "Mục tiêu cá nhân",
      aiStyle: "Cách trình bày câu trả lời",
      concise: "Ngắn gọn",
      detailed: "Chi tiết",
      coach: "Đồng hành và hướng dẫn",
      planMode: "Chế độ lập kế hoạch",
      phasedPlan: "Kế hoạch theo giai đoạn",
      recurringPlan: "Kế hoạch tuần lặp lại",
      pipelinePlan: "Lập kế hoạch từng ngày",
      recurrenceCycles: "Số chu kỳ tuần",
      feedback: "Phản hồi cho ngày kế tiếp",
      feedbackHint: "Cho trợ lý biết điều gì hiệu quả, điều gì khó khăn hoặc cần thay đổi vào ngày sau.",
      phase: "Giai đoạn",
      taskSettings: "Cài đặt nhiệm vụ",
      minTasks: "Số nhiệm vụ tối thiểu",
      maxTasks: "Số nhiệm vụ tối đa",
      subtaskSettings: "Cài đặt bước thực hiện",
      createSubtasksOnSave: "Tạo các bước thực hiện khi lưu",
      minSubtasks: "Số bước tối thiểu",
      maxSubtasks: "Số bước tối đa",
      scheduleAfterSaving: "Tạo lịch sau khi lưu",
      newTask: "Nhiệm vụ mới",
      minutes: "Số phút",
      addTask: "Thêm nhiệm vụ",
      dueBefore: "Hạn trước ngày",
      noTasksMatch: "Không có nhiệm vụ phù hợp",
      noTasksDescription: "Đổi bộ lọc hoặc thêm nhiệm vụ vào dự án.",
      scheduleView: "Lịch làm",
      goal: "Mục tiêu",
      generateSuggestions: "Tạo gợi ý",
      saveSuggestions: "Lưu gợi ý",
      repromptTask: "Nhờ trợ lý sửa",
      repromptLabel: "Bạn muốn thay đổi điều gì?",
      repromptPlaceholder:
        "Ví dụ: Làm nhiệm vụ này thực tế hơn, giảm phạm vi và thêm các bước chuẩn bị rõ ràng.",
      applyReprompt: "Tạo nhiệm vụ thay thế",
      repromptError: "Không thể tạo lại nhiệm vụ này.",
      aiGeneratedDescription: "Gợi ý do trợ lý tạo, đang chờ bạn xem lại.",
      noTaskDeadline: "Nhiệm vụ chưa có hạn chót",
      noSubtasksYet: "Chưa có bước thực hiện.",
      subtasks: "bước thực hiện",
      editTask: "Chỉnh nhiệm vụ",
      taskDetails: "Chi tiết nhiệm vụ",
      expandTask: "Mở chi tiết nhiệm vụ",
      collapseTask: "Đóng chi tiết nhiệm vụ",
      scheduled: "Ngày làm",
      subtask: "Bước thực hiện",
      date: "Ngày",
      addSubtask: "Thêm bước thực hiện",
      designProjectForm: "Thiết kế biểu mẫu dự án",
      requestAiError: "Không nhận được gợi ý từ trợ lý.",
      saveAiError: "Không lưu được gợi ý.",
      autoScheduleError: "Đã lưu gợi ý, nhưng chưa làm mới được lịch.",
      loadProjectError: "Không tải được dự án.",
      updateProjectError: "Không cập nhật được dự án.",
      deleteProjectError: "Không xóa được dự án.",
      deleteProjectTitle: "Xóa dự án?",
      deleteProjectWarning: "Thao tác này không thể hoàn tác.",
      deleteProjectDescription:
        "Dự án, toàn bộ nhiệm vụ, các bước thực hiện và dữ liệu lịch sẽ bị xóa vĩnh viễn.",
      deletingProject: "Đang xóa...",
      createTaskError: "Không tạo được nhiệm vụ.",
      updateTaskError: "Không cập nhật được nhiệm vụ.",
      deleteTaskError: "Không xóa được nhiệm vụ.",
      createSubtaskError: "Không tạo được bước thực hiện.",
      updateSubtaskError: "Không cập nhật được bước thực hiện.",
      deleteSubtaskError: "Không xóa được bước thực hiện.",
      generateScheduleError: "Không tạo được lịch.",
    },
    schedule: {
      emptyTitle: "Chưa có bước thực hiện được lên lịch",
      emptyDescription:
        "Tạo lịch sau khi thêm các bước thực hiện chưa hoàn tất.",
    },
    modal: {
      close: "Đóng",
    },
    auth: {
      loginSubtitle: "Đăng nhập vào khu vực làm việc của bạn.",
      email: "Email",
      password: "Mật khẩu",
      login: "Đăng nhập",
      needAccount: "Chưa có tài khoản?",
      register: "Đăng ký",
      createAccount: "Tạo tài khoản",
      registerSubtitle: "Bắt đầu lập kế hoạch dự án với nhiệm vụ và các bước thực hiện.",
      name: "Tên",
      confirmPassword: "Xác nhận mật khẩu",
      otp: "Mã xác thực email",
      sendOtp: "Gửi mã",
      sendOtpCountdown: "Gửi lại sau",
      otpSent: "Mã gồm 6 chữ số đã được gửi đến email của bạn.",
      checkMailFolders:
        "Vui lòng kiểm tra tất cả thư mục email, bao gồm Thư rác và Thùng rác, để tìm mã xác thực.",
      otpSendError: "Không gửi được mã xác thực.",
      alreadyHaveAccount: "Đã có tài khoản?",
      apiError: "Không kết nối được API.",
    },
  },
} as const;

export type AppText = (typeof appText)[AppLanguage];

export function getAppText(language: AppLanguage): AppText {
  return appText[language];
}

export function useAppText(): AppText {
  const { preferences } = usePreferences();

  return getAppText(preferences.language);
}
