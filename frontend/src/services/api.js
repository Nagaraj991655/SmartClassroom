const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const getFileUrl = (filePath) => {
  if (!filePath || /^https?:\/\//i.test(filePath)) return filePath;
  const apiOrigin = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;
  return `${apiOrigin}${filePath}`;
};

export const authStorage = {
  getCookie: (name) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setCookie: (name, value, days = 7) => {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  deleteCookie: (name) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  },
  getToken: () => {
    return authStorage.getCookie("smartclass_jwt") || (typeof localStorage !== "undefined" ? localStorage.getItem("smartclass_token") : null);
  },
  getUser: () => {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem("smartclass_user");
    return raw ? JSON.parse(raw) : null;
  },
  setAuth: (token, user) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("smartclass_token", token);
      localStorage.setItem("smartclass_user", JSON.stringify(user));
    }
    authStorage.setCookie("smartclass_jwt", token, 7);
  },
  clearAuth: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("smartclass_token");
      localStorage.removeItem("smartclass_user");
    }
    authStorage.deleteCookie("smartclass_jwt");
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = { ...options.headers };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let errorMsg = "An unexpected error occurred.";
    if (typeof data?.detail === "string") {
      errorMsg = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      errorMsg = data.detail[0]?.msg || "Validation error occurred.";
    } else if (data?.message) {
      errorMsg = data.message;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  fileUrl: getFileUrl,
  login: async (role, identifier, password) => {
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ role, identifier, password })
    });
    authStorage.setAuth(res.access_token, res.user);
    return res;
  },
  getMe: () => request("/auth/me"),
  adminForgotPassword: (email) => request("/auth/admin/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  adminVerifyOtp: (email, otp) => request("/auth/admin/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),
  adminResetPassword: (email, reset_token, new_password) => request("/auth/admin/reset-password", { method: "POST", body: JSON.stringify({ email, reset_token, new_password }) }),
  studentForgotPassword: (email) => request("/auth/student/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  studentVerifyOtp: (email, otp) => request("/auth/student/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),
  studentResetPassword: (email, reset_token, new_password) => request("/auth/student/reset-password", { method: "POST", body: JSON.stringify({ email, reset_token, new_password }) }),
  teacherForgotPassword: (email) => request("/auth/teacher/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  teacherVerifyOtp: (email, otp) => request("/auth/teacher/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),
  teacherResetPassword: (email, reset_token, new_password) => request("/auth/teacher/reset-password", { method: "POST", body: JSON.stringify({ email, reset_token, new_password }) }),

  adminGetStats: () => request("/admin/stats"),
  adminGetDepartments: () => request("/admin/departments"),
  adminAddDepartment: (data) => request("/admin/departments", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateDepartment: (id, data) => request(`/admin/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteDepartment: (id) => request(`/admin/departments/${id}`, { method: "DELETE" }),
  adminGetSubjects: () => request("/admin/subjects"),
  adminAddSubject: (data) => request("/admin/subjects", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateSubject: (id, data) => request(`/admin/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteSubject: (id) => request(`/admin/subjects/${id}`, { method: "DELETE" }),
  adminGetTeachers: () => request("/admin/teachers"),
  adminGetNextTeacherId: () => request("/admin/teachers/next-id"),
  adminCheckTeacherId: (teachId) => request(`/admin/teachers/check-id?teach_id=${encodeURIComponent(teachId)}`),
  adminAddTeacher: (data) => request("/admin/teachers", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateTeacher: (id, data) => request(`/admin/teachers/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteTeacher: (id) => request(`/admin/teachers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  adminGetStudents: () => request("/admin/students"),
  adminAddStudent: (data) => request("/admin/students", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateStudent: (id, data) => request(`/admin/students/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteStudent: (id) => request(`/admin/students/${encodeURIComponent(id)}`, { method: "DELETE" }),

  teacherGetSubjects: () => request("/teacher/subjects"),
  teacherGetAssignments: () => request("/teacher/assignments"),
  teacherCreateAssignment: (formData) => request("/teacher/assignments", { method: "POST", body: formData }),
  teacherGetSubmissions: (id) => request(`/teacher/assignments/${id}/submissions`),
  teacherGradeSubmission: (submissionId, marks, feedback) => request(`/teacher/submissions/${submissionId}/grade`, {
    method: "POST",
    body: JSON.stringify({ marks: parseFloat(marks), feedback })
  }),

  studentGetProfile: () => request("/student/profile"),
  studentGetSubjects: () => request("/student/subjects"),
  studentGetAssignments: () => request("/student/assignments"),
  studentSubmitAssignment: (assignmentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/student/assignments/${assignmentId}/submit`, { method: "POST", body: formData });
  },
  studentTrackQuestionActivity: (assignmentId, action = "view") =>
    request(`/student/assignments/${assignmentId}/activity?action=${encodeURIComponent(action)}`, {
      method: "POST"
    }),
  studentGetGrades: () => request("/student/grades")
};
