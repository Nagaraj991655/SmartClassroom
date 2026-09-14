from fastapi import APIRouter, Depends
from app.middleware.auth import require_role
from app.model.schemas import (
    CreateDepartmentRequest,
    CreateSubjectRequest,
    CreateTeacherRequest,
    UpdateTeacherRequest,
    CreateStudentRequest
)
from app.controller.admin_controller import (
    list_departments,
    add_department,
    edit_department,
    remove_department,
    list_subjects,
    add_subject,
    edit_subject,
    remove_subject,
    list_teachers,
    fetch_next_teacher_id,
    check_teach_id_availability,
    add_teacher,
    edit_teacher,
    remove_teacher,
    list_students,
    add_student,
    get_stats
)

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))]
)

@router.get("/stats")
def get_dashboard_stats():
    return get_stats()

@router.get("/departments")
def get_departments():
    return list_departments()

@router.post("/departments")
def create_new_department(data: CreateDepartmentRequest):
    return add_department(data)

@router.put("/departments/{dep_id}")
def update_existing_department(dep_id: int, data: CreateDepartmentRequest):
    return edit_department(dep_id, data)

@router.delete("/departments/{dep_id}")
def delete_existing_department(dep_id: int):
    return remove_department(dep_id)

@router.get("/subjects")
def get_subjects():
    return list_subjects()

@router.post("/subjects")
def create_new_subject(data: CreateSubjectRequest):
    return add_subject(data)

@router.put("/subjects/{sub_id}")
def update_existing_subject(sub_id: int, data: CreateSubjectRequest):
    return edit_subject(sub_id, data)

@router.delete("/subjects/{sub_id}")
def delete_existing_subject(sub_id: int):
    return remove_subject(sub_id)

@router.get("/teachers")
def get_teachers():
    return list_teachers()

@router.get("/teachers/next-id")
def get_next_teacher_identifier():
    return {"next_teach_id": fetch_next_teacher_id()}

@router.get("/teachers/check-id")
def check_teacher_id(teach_id: str):
    return {"exists": check_teach_id_availability(teach_id)}

@router.post("/teachers")
def create_new_teacher(data: CreateTeacherRequest):
    return add_teacher(data)

@router.put("/teachers/{teach_id}")
def update_existing_teacher(teach_id: str, data: UpdateTeacherRequest):
    return edit_teacher(teach_id, data)

@router.delete("/teachers/{teach_id}")
def delete_existing_teacher(teach_id: str):
    return remove_teacher(teach_id)

@router.get("/students")
def get_students():
    return list_students()

@router.post("/students")
def create_new_student(data: CreateStudentRequest):
    return add_student(data)
