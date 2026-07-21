"use client";

import { type AppLanguage, usePreferences } from "@/lib/preferences";

export const appText = {
  en: {
    common: {
      add: "Add",
      all: "All",
      back: "Back",
      cancel: "Cancel",
      createProject: "Create goal",
      delete: "Delete",
      done: "Done",
      due: "Due",
      guide: "Guide",
      loading: "Loading",
      minutes: "minutes",
      min: "min",
      minPerDay: "min/day",
      newProject: "New goal",
      noDate: "No date",
      noDescription: "No description",
      priority: "Priority",
      projects: "Goals",
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
      learnFromTaskPatterns: "Learn from my task format",
      learnFromTaskPatternsHint:
        "Let AI imitate the structure and detail level of tasks you create manually. Goal content is not copied.",
      english: "English",
      vietnamese: "Vietnamese",
      profile: "Profile",
    },
    guide: {
      step: (current: number, total: number) => `Step ${current} of ${total}`,
      close: "Close guide",
      next: "Next",
      done: "Done",
      highlightHint: "Use the highlighted area, then continue to the next step.",
      welcome: {
        title: "Wake up with a clear next step",
        introduction:
          "TaskFlow Planner began with a simple observation: many people wake up unsure what to do first, even though a realistic plan can give the whole day direction.",
        morning: {
          title: "Plan before the morning starts",
          description:
            "Before your usual morning routine, spend one minute sharing your goal, deadline, and available time.",
        },
        planning: {
          title: "Turn goals into practical work",
          description:
            "The assistant drafts concrete tasks and smaller steps that fit the time you actually have.",
        },
        feedback: {
          title: "Improve tomorrow with feedback",
          description:
            "Mark completed work and describe what helped or got in the way. Daily planning uses that feedback as its highest-priority context for the next plan.",
        },
        tourDescription:
          "The short tour creates a sample goal, then shows you how to generate tasks, mark work Done, and give the assistant feedback.",
        start: "Start the tour",
        skip: "Explore on my own",
        creatingSampleGoal: "Creating your sample goal...",
        sampleGoalName: "Crochet a simple tote bag",
        sampleGoalDescription:
          "- Main goal: Finish one simple crochet tote bag that can carry light personal items.\n- Supporting goals: Choose yarn and hook, learn the base stitch, make the body, and attach sturdy handles.\n- Skills gained: Read a beginner pattern, maintain even tension, join pieces, and finish loose ends.\n- Constraints: Work about 60 minutes per day using beginner-friendly materials.\n- Done criteria: The bag holds its shape, both handles are secure, and loose ends are hidden.",
      },
      dashboardSteps: [
        {
          title: "Open your first goal",
          description:
            "Start here when you have a goal, deadline, and daily time budget.",
          details: [
            "The tour creates a simple crochet goal for you.",
            "Open a goal to review its type, planning mode, deadline, and minutes per day.",
            "Use Description as the AI brief: explain the target user, scope, required features, tech constraints, and what done should look like.",
          ],
        },
        {
          title: "Capture one-off work",
          description:
            "Use a one-off task for an independent action that does not need an AI plan, daily capacity, or a separate goal.",
          details: [
            "Set an optional deadline and effort estimate, then mark the task Done from the dashboard.",
            "A manual one-off task can also teach the assistant your preferred writing format when task-format learning is enabled.",
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
            "Use the goal name as a short promise of what you want to finish.",
          details: [
            "Prefer concrete names like Portfolio planner MVP over vague study app.",
            "The name helps you recognize the goal in dashboards and schedules.",
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
            "Save the goal, then review AI suggestions before saving them as tasks.",
          details: [
            "Saved AI tasks can be expanded, edited, and checked with their subtasks.",
          ],
        },
      ],
      projectSteps: [
        {
          title: "Use the goal controls",
          description:
            "Restart this guide, return to all goals, or delete this goal from the top controls.",
          details: [
            "Delete always asks for confirmation and removes the goal, tasks, steps, and schedule.",
            "Return to Goals when you want to compare or open another plan.",
          ],
        },
        {
          title: "Confirm the goal details",
          description:
            "This is the goal contract: deadline and daily capacity shape every schedule.",
          details: [
            "Choose an icon, goal type, and planning mode that match how the work repeats.",
            "Keep the description concrete because AI suggestions reuse it as context.",
            "Save changes after updating the deadline or available minutes per day.",
          ],
        },
        {
          title: "Use AI as a draft",
          description:
            "AI breakdown suggests work items, but you review them before saving.",
          details: [
            "Choose response detail, task limits, and whether steps should be included.",
            "Recurring goals can repeat weekly plans; daily pipeline goals prioritize your latest feedback.",
            "Open the small help button here for the complete AI suggestion guide.",
          ],
        },
        {
          title: "Add a task manually",
          description:
            "Use Add task when you already know a concrete result that belongs in this goal.",
          details: [
            "The button opens a focused form for title, description, priority, effort, and deadline.",
            "Task deadlines cannot be before today or after the goal deadline.",
            "Manual tasks can teach the assistant your preferred format when learning is enabled in Settings.",
          ],
        },
        {
          title: "Filter the task list",
          description:
            "Narrow the list by status, priority, or latest acceptable deadline.",
          details: [
            "Clear a filter to include every value again.",
            "Filters only change what you see; they do not change or delete tasks.",
          ],
        },
        {
          title: "Manage tasks and steps",
          description:
            "Open a task to edit its details, inspect resources, and manage the smaller steps inside it.",
          details: [
            "Add, edit, schedule, complete, reopen, or delete individual steps.",
            "Use Done on the task when the full result is complete.",
            "Completing work updates goal progress on the dashboard.",
            "Completion patterns and written AI feedback improve future daily plans.",
          ],
        },
        {
          title: "Read the schedule",
          description:
            "Scheduled steps appear in this column grouped by day and checked against daily capacity.",
          details: [
            "Saving AI suggestions can refresh this schedule automatically.",
            "Adjust a step's scheduled date inside its task when the plan changes.",
          ],
        },
      ],
      aiSuggestSteps: [
        {
          title: "Choose the response detail",
          description:
            "The assistant already uses the goal description. Choose how much explanation the plan should contain.",
          details: [
            "Edit the goal description above when the main result, supporting outcomes, skills, or constraints change.",
            "Detailed is the best default for instructions you can follow immediately.",
          ],
        },
        {
          title: "Control the amount of work",
          description:
            "Set task and subtask limits so the draft stays useful and fits the goal deadline.",
          details: [
            "Task and subtask controls start collapsed; open only the section you want to adjust.",
            "Tasks should represent meaningful outcomes; subtasks should explain the concrete steps.",
            "Disable subtasks only when you want a high-level plan.",
          ],
        },
        {
          title: "Generate the plan",
          description:
            "Click Generate suggestions. The plan opens in a review window when it is ready.",
          details: [
            "The review window includes tasks, steps, deadlines, and useful learning resources.",
            "Regenerate anything unsuitable before saving the plan to the goal.",
          ],
        },
      ],
    },
    dashboard: {
      title: "Dashboard",
      description:
        "A compact view of current goals, deadlines, and scheduled work.",
      loadError: "Unable to load dashboard data.",
      loading: "Loading dashboard",
      projects: "Goals",
      dueSoon: "Due soon",
      inProgress: "In progress",
      today: "Today",
      tasksDueSoon: "Tasks due soon",
      todayScheduledSubtasks: "Today scheduled subtasks",
      noSubtasksToday: "No subtasks scheduled today",
      projectProgress: "Goal progress",
      noUpcomingTaskDeadlines: "No upcoming task deadlines",
      completeTask: "Mark task complete",
      reopenTask: "Reopen task",
      taskDetails: "Task details",
      oneOffTasks: "One-off tasks",
      oneOffTasksDescription:
        "Capture work that needs to be done once without creating a goal.",
      oneOffTask: "One-off task",
      newOneOffTask: "New one-off task",
      editOneOffTask: "Edit one-off task",
      oneOffTaskFormHint:
        "Use this for a single independent action. Add a clear result, realistic effort, and an optional deadline.",
      createOneOffTask: "Create task",
      noOneOffTasks: "No one-off tasks yet",
      createOneOffTaskError: "Unable to create the one-off task.",
      updateOneOffTaskError: "Unable to update the one-off task.",
      deleteOneOffTaskError: "Unable to delete the one-off task.",
      deleteOneOffTaskTitle: "Delete one-off task?",
      deleteOneOffTaskConfirmation:
        "This task will be permanently deleted. This action cannot be undone.",
    },
    projects: {
      title: "Goals",
      description:
        "Plan goals, track progress, and schedule subtasks before deadlines.",
      loadError: "Unable to load goals.",
      loading: "Loading goals",
      emptyTitle: "No goals yet",
      emptyDescription: "Create a goal with a deadline and daily capacity.",
      openProject: "Open goal",
    },
    newProject: {
      title: "New goal",
      description: "Set the outcome, planning approach, deadline, and daily capacity.",
      projectName: "Goal name",
      descriptionLabel: "Description",
      descriptionPlaceholder:
        "- Main goal: Build a task planner students can use every day.\n- Supporting goals: Add sign-in, goals, AI breakdown, schedules, and a useful dashboard.\n- Skills gained: Next.js, Laravel, database design, API integration, and deployment.\n- Constraints: Finish an MVP before the deadline with the available daily time.\n- Done criteria: A new user can register, create a goal, generate a plan, and mark work complete.",
      descriptionHint:
        "Use one bullet per outcome, supporting result, skill, constraint, or completion criterion. The assistant uses this description as its planning brief.",
      deadline: "Deadline",
      availableMinutes: "Available minutes per day",
      saveProject: "Save goal",
      createError: "Unable to create goal.",
    },
    project: {
      fallbackTitle: "Goal",
      fallbackDescription: "Goal workspace",
      loading: "Loading goal",
      projectInformation: "Goal information",
      projectInformationHint: "Update the description and planning context used by the assistant.",
      name: "Name",
      icon: "Goal icon",
      projectType: "Goal type",
      shortTerm: "Short-term",
      longTerm: "Long-term",
      dailyRecurring: "Daily recurring",
      description: "Description",
      deadline: "Deadline",
      minutesPerDay: "Minutes per day",
      schedule: "Schedule",
      generateSchedule: "Generate schedule",
      refreshSchedule: "Refresh schedule",
      aiBreakdown: "AI breakdown",
      aiPlan: "AI-generated plan",
      aiCallout: "Use the goal description to generate detailed tasks, scheduled steps, and useful resources.",
      aiSettings: "AI settings",
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
      tasks: "tasks",
      minTasks: "Min tasks",
      maxTasks: "Max tasks",
      subtaskSettings: "Subtask settings",
      subtasksDisabled: "Subtasks disabled",
      createSubtasksOnSave: "Create subtasks when saving",
      minSubtasks: "Min subtasks",
      maxSubtasks: "Max subtasks",
      scheduleAfterSaving: "Schedule after saving",
      newTask: "New task",
      newTaskHint: "Add a task manually when you already know the next result to complete.",
      manualTaskLearningEnabled:
        "AI learning is on. Future suggestions will follow the title structure, description detail, and subtask breakdown of tasks you create manually, without copying goal-specific content.",
      manualTaskLearningDisabled:
        "AI learning is off. Turn on \"Learn from my task format\" in Settings when you want future suggestions to follow how you write manual tasks.",
      newTaskDialogHint:
        "Describe a concrete result, then set its priority, effort, and deadline inside this goal window.",
      minutes: "Minutes",
      addTask: "Add task",
      dueBefore: "Due before",
      noTasksMatch: "No tasks match",
      noTasksDescription: "Adjust filters or add a task to this goal.",
      scheduleView: "Schedule view",
      goal: "Goal",
      generateSuggestions: "Generate suggestions",
      saveSuggestions: "Save suggestions",
      repromptTask: "Regenerate task",
      repromptSubtask: "Regenerate subtask",
      repromptTaskDialogTitle: "Regenerate this task",
      repromptSubtaskDialogTitle: "Regenerate this subtask",
      repromptMemoryNotice:
        "Your feedback is saved to this goal's AI memory and will guide future suggestions.",
      resources: "Resources",
      repromptLabel: "What should change?",
      repromptPlaceholder:
        "Example: Make this task more practical, reduce the scope, and add clearer setup steps.",
      repromptSubtaskPlaceholder:
        "Example: This step is too vague. Name the tool, exact action, expected result, and how to verify it.",
      applyReprompt: "Generate replacement",
      repromptError: "Unable to revise this task.",
      repromptSubtaskError: "Unable to revise this subtask.",
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
      designProjectForm: "Design goal form",
      requestAiError: "Unable to request AI suggestions.",
      saveAiError: "Unable to save suggestions.",
      autoScheduleError: "Suggestions were saved, but the schedule could not be refreshed.",
      loadProjectError: "Unable to load goal.",
      updateProjectError: "Unable to update goal.",
      deleteProjectError: "Unable to delete goal.",
      deleteProjectTitle: "Delete goal?",
      deleteProjectWarning: "This action cannot be undone.",
      deleteProjectDescription:
        "The goal, all of its tasks, steps, and schedule data will be permanently deleted.",
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
      rememberForThirtyDays: "Keep me signed in for 30 days",
      login: "Login",
      needAccount: "Need an account?",
      register: "Register",
      createAccount: "Create account",
      registerSubtitle: "Turn goals into practical tasks and daily steps.",
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
      continueWithGoogle: "Continue with Google",
      signUpWithGoogle: "Sign up with Google",
      orContinueWithEmail: "or continue with email",
      googleCompleting: "Completing Google sign-in...",
      googleNotConfigured: "Google sign-in is not configured yet.",
      googleEmailUnverified:
        "Google did not provide a verified email for this account.",
      googleAccountConflict:
        "This email is already linked to a different Google account.",
      googleAuthFailed: "Google sign-in could not be completed. Please try again.",
      googleSessionFailed:
        "Google approved the sign-in, but the app session could not be created.",
      backToLogin: "Back to login",
    },
  },
  vi: {
    common: {
      add: "Thêm",
      all: "Tất cả",
      back: "Quay lại",
      cancel: "Hủy",
      createProject: "Tạo mục tiêu",
      delete: "Xóa",
      done: "Xong",
      due: "Hạn",
      guide: "Hướng dẫn",
      loading: "Đang tải",
      minutes: "phút",
      min: "phút",
      minPerDay: "phút/ngày",
      newProject: "Mục tiêu mới",
      noDate: "Chưa có ngày",
      noDescription: "Chưa có mô tả",
      priority: "Độ ưu tiên",
      projects: "Mục tiêu",
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
      learnFromTaskPatterns: "Học theo cách tôi viết nhiệm vụ",
      learnFromTaskPatternsHint:
        "Cho phép trợ lý học cấu trúc và mức độ chi tiết từ các nhiệm vụ bạn tự tạo. Nội dung của mục tiêu khác sẽ không bị sao chép.",
      english: "Tiếng Anh",
      vietnamese: "Tiếng Việt",
      profile: "Hồ sơ",
    },
    guide: {
      step: (current: number, total: number) => `Bước ${current}/${total}`,
      close: "Đóng hướng dẫn",
      next: "Tiếp",
      done: "Hoàn tất",
      highlightHint: "Thao tác tại vùng đang được làm nổi bật, sau đó chuyển sang bước tiếp theo.",
      welcome: {
        title: "Thức dậy và biết rõ việc cần làm",
        introduction:
          "TaskFlow Planner bắt đầu từ một điều rất đời thường: nhiều người thức dậy nhưng không biết nên bắt đầu từ đâu, trong khi một kế hoạch hợp lý có thể tạo hướng đi rõ ràng cho cả ngày.",
        morning: {
          title: "Lập kế hoạch trước khi bắt đầu buổi sáng",
          description:
            "Trước khi vệ sinh cá nhân và bắt đầu công việc thường ngày, hãy dành một phút để ghi mục tiêu, hạn chót và thời gian bạn có.",
        },
        planning: {
          title: "Biến mục tiêu thành việc có thể làm ngay",
          description:
            "Trợ lý sẽ phác thảo các nhiệm vụ cụ thể và chia thành những bước nhỏ phù hợp với quỹ thời gian thực tế.",
        },
        feedback: {
          title: "Dùng phản hồi để cải thiện ngày mai",
          description:
            "Đánh dấu việc đã xong và ghi lại điều thuận lợi hoặc trở ngại. Khi lập kế hoạch từng ngày, trợ lý sẽ ưu tiên phản hồi đó cho kế hoạch kế tiếp.",
        },
        tourDescription:
          "Hướng dẫn sẽ tạo sẵn một mục tiêu mẫu, sau đó chỉ bạn cách tạo nhiệm vụ, đánh dấu Xong và gửi phản hồi cho trợ lý.",
        start: "Bắt đầu hướng dẫn",
        skip: "Tự khám phá",
        creatingSampleGoal: "Đang tạo mục tiêu mẫu...",
        sampleGoalName: "Móc một chiếc túi len đơn giản",
        sampleGoalDescription:
          "- Mục tiêu chính: Hoàn thành một chiếc túi len đơn giản có thể đựng các vật dụng nhẹ.\n- Mục tiêu phụ: Chọn len và kim móc, học mũi nền, móc thân túi và gắn quai chắc chắn.\n- Kỹ năng đạt được: Đọc mẫu cơ bản, giữ lực tay đều, nối các phần và giấu đầu len.\n- Giới hạn: Thực hiện khoảng 60 phút mỗi ngày bằng vật liệu phù hợp cho người mới.\n- Tiêu chí hoàn thành: Túi giữ được dáng, hai quai chắc chắn và các đầu len đã được giấu.",
      },
      dashboardSteps: [
        {
          title: "Mở mục tiêu đầu tiên",
          description:
            "Bắt đầu ở đây khi bạn có mục tiêu, hạn chót và quỹ thời gian mỗi ngày.",
          details: [
            "Hướng dẫn sẽ tạo sẵn mục tiêu móc một chiếc túi len đơn giản.",
            "Mở mục tiêu để xem loại, chế độ lập kế hoạch, hạn chót và số phút mỗi ngày.",
            "Trong phần Mô tả, hãy ghi rõ người sử dụng, phạm vi, tính năng cần có, các giới hạn và kết quả được xem là hoàn thành để trợ lý hiểu đúng yêu cầu.",
          ],
        },
        {
          title: "Ghi nhanh công việc một lần",
          description:
            "Dùng nhiệm vụ một lần cho công việc độc lập, không cần trợ lý lập kế hoạch, quỹ thời gian mỗi ngày hay một mục tiêu riêng.",
          details: [
            "Bạn có thể đặt hạn chót, thời lượng dự kiến rồi đánh dấu Xong ngay trên trang tổng quan.",
            "Nhiệm vụ một lần do bạn tự viết cũng có thể giúp trợ lý học cách trình bày khi tùy chọn học đang bật.",
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
            "Tên mục tiêu nên mô tả ngắn gọn kết quả bạn muốn hoàn thành.",
          details: [
            "Ưu tiên tên cụ thể như Hoàn thành hồ sơ năng lực cá nhân thay vì Ứng dụng học tập chung chung.",
            "Tên này giúp bạn dễ nhận ra mục tiêu trên trang tổng quan và lịch làm.",
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
            "Lưu mục tiêu, sau đó xem lại các gợi ý trước khi lưu thành nhiệm vụ.",
          details: [
            "Bạn có thể mở, chỉnh sửa và kiểm tra từng nhiệm vụ cùng các bước thực hiện bên trong.",
          ],
        },
      ],
      projectSteps: [
        {
          title: "Dùng các nút điều khiển mục tiêu",
          description:
            "Mở lại hướng dẫn, quay về danh sách mục tiêu hoặc xóa mục tiêu bằng các nút phía trên.",
          details: [
            "Khi xóa, ứng dụng luôn yêu cầu xác nhận và sẽ xóa mục tiêu, nhiệm vụ, bước thực hiện cùng dữ liệu lịch.",
            "Quay về Mục tiêu khi bạn muốn so sánh hoặc mở một kế hoạch khác.",
          ],
        },
        {
          title: "Kiểm tra thông tin mục tiêu",
          description:
            "Hạn chót và thời lượng mỗi ngày trong phần này sẽ quyết định lịch làm.",
          details: [
            "Chọn biểu tượng, loại mục tiêu và chế độ lập kế hoạch phù hợp với nhịp lặp của công việc.",
            "Viết mô tả cụ thể vì trợ lý sẽ dùng phần này để hiểu mục tiêu.",
            "Nhớ lưu thay đổi sau khi chỉnh hạn chót hoặc số phút có thể làm mỗi ngày.",
          ],
        },
        {
          title: "Dùng trợ lý để tạo bản nháp",
          description:
            "Trợ lý sẽ chia nhỏ công việc, nhưng bạn vẫn nên xem lại trước khi lưu.",
          details: [
            "Chọn mức độ chi tiết, giới hạn số nhiệm vụ và có tạo các bước thực hiện hay không.",
            "Mục tiêu lặp lại có thể dùng kế hoạch tuần; chế độ từng ngày sẽ ưu tiên phản hồi mới nhất của bạn.",
            "Bấm nút hướng dẫn nhỏ trong khung này để xem đầy đủ quy trình tạo gợi ý.",
          ],
        },
        {
          title: "Tự thêm một nhiệm vụ",
          description:
            "Dùng nút Thêm nhiệm vụ khi bạn đã biết một kết quả cụ thể cần đưa vào mục tiêu.",
          details: [
            "Nút này mở biểu mẫu riêng cho tiêu đề, mô tả, độ ưu tiên, thời lượng và hạn chót.",
            "Hạn nhiệm vụ không được trước hôm nay hoặc sau hạn chót của mục tiêu.",
            "Nếu bật tính năng học trong Cài đặt, nhiệm vụ tự tạo sẽ giúp trợ lý học cách trình bày bạn mong muốn.",
          ],
        },
        {
          title: "Lọc danh sách nhiệm vụ",
          description:
            "Thu hẹp danh sách theo trạng thái, độ ưu tiên hoặc ngày hạn muộn nhất.",
          details: [
            "Xóa giá trị trong bộ lọc để hiện lại tất cả lựa chọn.",
            "Bộ lọc chỉ thay đổi nội dung đang xem, không chỉnh sửa hoặc xóa nhiệm vụ.",
          ],
        },
        {
          title: "Quản lý nhiệm vụ và bước thực hiện",
          description:
            "Mở nhiệm vụ để chỉnh thông tin, xem tài liệu và quản lý các bước thực hiện bên trong.",
          details: [
            "Bạn có thể thêm, sửa, lên lịch, hoàn tất, mở lại hoặc xóa từng bước thực hiện.",
            "Bấm Xong ở nhiệm vụ khi toàn bộ kết quả đã hoàn thành.",
            "Việc đánh dấu hoàn tất sẽ cập nhật tiến độ mục tiêu trên trang tổng quan.",
            "Nhịp độ hoàn thành và phản hồi cho trợ lý sẽ cải thiện kế hoạch những ngày sau.",
          ],
        },
        {
          title: "Đọc lịch làm",
          description:
            "Các bước đã lên lịch xuất hiện trong cột này theo từng ngày và được kiểm tra với quỹ thời gian mỗi ngày.",
          details: [
            "Khi lưu gợi ý từ trợ lý, lịch có thể được làm mới tự động.",
            "Nếu kế hoạch thay đổi, hãy chỉnh ngày làm của bước thực hiện ngay trong nhiệm vụ.",
          ],
        },
      ],
      aiSuggestSteps: [
        {
          title: "Chọn mức độ chi tiết",
          description:
            "Trợ lý đã dùng phần mô tả mục tiêu. Bạn chỉ cần chọn mức độ giải thích mong muốn trong kế hoạch.",
          details: [
            "Chỉnh mô tả mục tiêu phía trên khi mục tiêu chính, mục tiêu phụ, kỹ năng hoặc giới hạn thay đổi.",
            "Chi tiết là lựa chọn phù hợp khi bạn cần hướng dẫn có thể làm theo ngay.",
          ],
        },
        {
          title: "Giới hạn khối lượng công việc",
          description:
            "Đặt số nhiệm vụ và bước thực hiện để bản nháp vừa hữu ích, vừa nằm trong hạn chót của mục tiêu.",
          details: [
            "Phần nhiệm vụ và bước thực hiện được thu gọn mặc định; chỉ mở phần bạn cần điều chỉnh.",
            "Nhiệm vụ nên là kết quả lớn; các bước thực hiện nên mô tả việc cụ thể cần làm.",
            "Chỉ tắt các bước thực hiện khi bạn muốn một kế hoạch khái quát.",
          ],
        },
        {
          title: "Tạo kế hoạch",
          description:
            "Bấm Tạo gợi ý. Khi hoàn tất, kế hoạch sẽ mở trong cửa sổ để bạn xem lại.",
          details: [
            "Cửa sổ xem lại gồm nhiệm vụ, bước thực hiện, hạn chót và nguồn tài liệu hữu ích.",
            "Tạo lại phần chưa phù hợp trước khi lưu kế hoạch vào mục tiêu.",
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
      projects: "Mục tiêu",
      dueSoon: "Sắp tới hạn",
      inProgress: "Đang làm",
      today: "Hôm nay",
      tasksDueSoon: "Nhiệm vụ sắp tới hạn",
      todayScheduledSubtasks: "Các bước thực hiện hôm nay",
      noSubtasksToday: "Hôm nay chưa có bước thực hiện nào",
      projectProgress: "Tiến độ mục tiêu",
      noUpcomingTaskDeadlines: "Chưa có nhiệm vụ nào sắp tới hạn",
      completeTask: "Đánh dấu nhiệm vụ hoàn tất",
      reopenTask: "Mở lại nhiệm vụ",
      taskDetails: "Chi tiết nhiệm vụ",
      oneOffTasks: "Nhiệm vụ một lần",
      oneOffTasksDescription:
        "Ghi lại công việc chỉ cần làm một lần mà không phải tạo mục tiêu.",
      oneOffTask: "Nhiệm vụ một lần",
      newOneOffTask: "Nhiệm vụ một lần mới",
      editOneOffTask: "Chỉnh sửa nhiệm vụ một lần",
      oneOffTaskFormHint:
        "Dùng cho một công việc độc lập. Hãy ghi rõ kết quả cần đạt, thời lượng thực tế và hạn chót nếu có.",
      createOneOffTask: "Tạo nhiệm vụ",
      noOneOffTasks: "Chưa có nhiệm vụ một lần",
      createOneOffTaskError: "Không tạo được nhiệm vụ một lần.",
      updateOneOffTaskError: "Không cập nhật được nhiệm vụ một lần.",
      deleteOneOffTaskError: "Không xóa được nhiệm vụ một lần.",
      deleteOneOffTaskTitle: "Xóa nhiệm vụ một lần?",
      deleteOneOffTaskConfirmation:
        "Nhiệm vụ này sẽ bị xóa vĩnh viễn và không thể khôi phục.",
    },
    projects: {
      title: "Mục tiêu",
      description:
        "Lập mục tiêu, theo dõi tiến độ và lên lịch các bước thực hiện trước hạn chót.",
      loadError: "Không tải được danh sách mục tiêu.",
      loading: "Đang tải mục tiêu",
      emptyTitle: "Chưa có mục tiêu",
      emptyDescription: "Tạo mục tiêu với hạn chót và thời lượng mỗi ngày.",
      openProject: "Mở mục tiêu",
    },
    newProject: {
      title: "Mục tiêu mới",
      description: "Thiết lập mục tiêu, hạn chót và quỹ thời gian mỗi ngày.",
      projectName: "Tên mục tiêu",
      descriptionLabel: "Mô tả",
      descriptionPlaceholder:
        "- Mục tiêu chính: Xây dựng ứng dụng lập kế hoạch sinh viên có thể dùng mỗi ngày.\n- Mục tiêu phụ: Có đăng nhập, mục tiêu, trợ lý chia nhỏ công việc, lịch và trang tổng quan.\n- Kỹ năng đạt được: Next.js, Laravel, thiết kế cơ sở dữ liệu, kết nối API và triển khai.\n- Giới hạn: Hoàn thành bản dùng thử trước hạn chót với quỹ thời gian hiện có.\n- Tiêu chí hoàn thành: Người mới có thể đăng ký, tạo mục tiêu, nhận kế hoạch và đánh dấu công việc hoàn tất.",
      descriptionHint:
        "Mỗi gạch đầu dòng nên nêu một kết quả, mục tiêu phụ, kỹ năng, giới hạn hoặc tiêu chí hoàn thành. Trợ lý sẽ dùng phần mô tả này làm yêu cầu lập kế hoạch.",
      deadline: "Hạn chót",
      availableMinutes: "Số phút mỗi ngày",
      saveProject: "Lưu mục tiêu",
      createError: "Không tạo được mục tiêu.",
    },
    project: {
      fallbackTitle: "Mục tiêu",
      fallbackDescription: "Khu vực làm việc của mục tiêu",
      loading: "Đang tải mục tiêu",
      projectInformation: "Thông tin mục tiêu",
      projectInformationHint: "Điều chỉnh thông tin trợ lý dùng để lập kế hoạch.",
      name: "Tên",
      icon: "Biểu tượng mục tiêu",
      projectType: "Loại mục tiêu",
      shortTerm: "Ngắn hạn",
      longTerm: "Dài hạn",
      dailyRecurring: "Lặp lại hằng ngày",
      description: "Mô tả",
      deadline: "Hạn chót",
      minutesPerDay: "Phút mỗi ngày",
      schedule: "Lịch",
      generateSchedule: "Tạo lịch",
      refreshSchedule: "Làm mới lịch",
      aiBreakdown: "Trợ lý chia nhỏ công việc",
      aiPlan: "Kế hoạch do trợ lý tạo",
      aiCallout: "Dùng phần mô tả mục tiêu để tạo nhiệm vụ, bước thực hiện có lịch và nguồn tài liệu hữu ích.",
      aiSettings: "Cài đặt trợ lý",
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
      tasks: "nhiệm vụ",
      minTasks: "Số nhiệm vụ tối thiểu",
      maxTasks: "Số nhiệm vụ tối đa",
      subtaskSettings: "Cài đặt bước thực hiện",
      subtasksDisabled: "Không tạo bước thực hiện",
      createSubtasksOnSave: "Tạo các bước thực hiện khi lưu",
      minSubtasks: "Số bước tối thiểu",
      maxSubtasks: "Số bước tối đa",
      scheduleAfterSaving: "Tạo lịch sau khi lưu",
      newTask: "Nhiệm vụ mới",
      newTaskHint: "Tự thêm nhiệm vụ khi bạn đã biết kết quả tiếp theo cần hoàn thành.",
      manualTaskLearningEnabled:
        "AI đang học theo cách bạn viết. Các gợi ý sau sẽ tham khảo cấu trúc tiêu đề, mức độ chi tiết của mô tả và cách chia bước thực hiện trong nhiệm vụ bạn tự tạo, nhưng không sao chép nội dung riêng của mục tiêu.",
      manualTaskLearningDisabled:
        "AI chưa học theo nhiệm vụ tự tạo. Hãy bật \"Học theo cách tôi viết nhiệm vụ\" trong Cài đặt để các gợi ý sau làm theo cách trình bày của bạn.",
      newTaskDialogHint:
        "Mô tả một kết quả cụ thể, sau đó đặt độ ưu tiên, thời lượng và hạn chót trong khoảng thời gian của mục tiêu.",
      minutes: "Số phút",
      addTask: "Thêm nhiệm vụ",
      dueBefore: "Hạn trước ngày",
      noTasksMatch: "Không có nhiệm vụ phù hợp",
      noTasksDescription: "Đổi bộ lọc hoặc thêm nhiệm vụ vào mục tiêu.",
      scheduleView: "Lịch làm",
      goal: "Mục tiêu",
      generateSuggestions: "Tạo gợi ý",
      saveSuggestions: "Lưu gợi ý",
      repromptTask: "Tạo lại nhiệm vụ",
      repromptSubtask: "Tạo lại bước thực hiện",
      repromptTaskDialogTitle: "Tạo lại nhiệm vụ này",
      repromptSubtaskDialogTitle: "Tạo lại bước thực hiện này",
      repromptMemoryNotice:
        "Phản hồi này được lưu vào bộ nhớ trợ lý của mục tiêu và sẽ định hướng các gợi ý sau.",
      resources: "Nguồn tài liệu",
      repromptLabel: "Bạn muốn thay đổi điều gì?",
      repromptPlaceholder:
        "Ví dụ: Làm nhiệm vụ này thực tế hơn, giảm phạm vi và thêm các bước chuẩn bị rõ ràng.",
      repromptSubtaskPlaceholder:
        "Ví dụ: Bước này còn chung chung; hãy nêu công cụ, thao tác cụ thể, kết quả cần có và cách kiểm tra.",
      applyReprompt: "Tạo nội dung thay thế",
      repromptError: "Không thể tạo lại nhiệm vụ này.",
      repromptSubtaskError: "Không thể tạo lại bước thực hiện này.",
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
      designProjectForm: "Thiết kế biểu mẫu mục tiêu",
      requestAiError: "Không nhận được gợi ý từ trợ lý.",
      saveAiError: "Không lưu được gợi ý.",
      autoScheduleError: "Đã lưu gợi ý, nhưng chưa làm mới được lịch.",
      loadProjectError: "Không tải được mục tiêu.",
      updateProjectError: "Không cập nhật được mục tiêu.",
      deleteProjectError: "Không xóa được mục tiêu.",
      deleteProjectTitle: "Xóa mục tiêu?",
      deleteProjectWarning: "Thao tác này không thể hoàn tác.",
      deleteProjectDescription:
        "Mục tiêu, toàn bộ nhiệm vụ, các bước thực hiện và dữ liệu lịch sẽ bị xóa vĩnh viễn.",
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
      rememberForThirtyDays: "Giữ đăng nhập trong 30 ngày",
      login: "Đăng nhập",
      needAccount: "Chưa có tài khoản?",
      register: "Đăng ký",
      createAccount: "Tạo tài khoản",
      registerSubtitle: "Biến mục tiêu thành nhiệm vụ và các bước thực hiện rõ ràng.",
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
      continueWithGoogle: "Tiếp tục với Google",
      signUpWithGoogle: "Đăng ký bằng Google",
      orContinueWithEmail: "hoặc tiếp tục bằng email",
      googleCompleting: "Đang hoàn tất đăng nhập Google...",
      googleNotConfigured: "Đăng nhập Google chưa được cấu hình.",
      googleEmailUnverified:
        "Google không cung cấp email đã xác thực cho tài khoản này.",
      googleAccountConflict:
        "Email này đã được liên kết với một tài khoản Google khác.",
      googleAuthFailed: "Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.",
      googleSessionFailed:
        "Google đã chấp nhận đăng nhập nhưng ứng dụng không thể tạo phiên sử dụng.",
      backToLogin: "Quay lại đăng nhập",
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
