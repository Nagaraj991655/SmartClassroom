from fastapi import HTTPException, status
from app.model.schemas import (
    CreateDepartmentRequest,
    CreateSubjectRequest,
    CreateTeacherRequest,
    CreateStudentRequest
)
from app.model.admin_model import (
    get_all_departments,
    create_department,
    get_all_subjects,
    create_subject,
    link_department_subject,
    get_all_teachers,
    create_teacher,
    get_all_students,
    create_student,
    get_system_stats
)
from app.helper.password import hash_password

def list_departments():
    return get_all_departments()

def add_department(data: CreateDepartmentRequest):
    try:
        dep_id = create_department(data.dep_name)
        return {"message": "Department created successfully", "dep_id": dep_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create department: {str(e)}")

def list_subjects():
    return get_all_subjects()

def add_subject(data: CreateSubjectRequest):
    try:
        sub_id = create_subject(data.sub_name)
        if data.dep_id:
            link_department_subject(data.dep_id, sub_id)
        return {"message": "Subject created successfully", "sub_id": sub_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create subject: {str(e)}")

def list_teachers():
    return get_all_teachers()

def add_teacher(data: CreateTeacherRequest):
    try:
        hashed = hash_password(data.password)
        create_teacher(
            teach_id=data.teach_id,
            teach_name=data.teach_name,
            email=data.email,
            password_hash=hashed,
            subject_ids=data.subject_ids
        )
        return {"message": f"Teacher '{data.teach_name}' registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create teacher: {str(e)}")

def list_students():
    return get_all_students()

def add_student(data: CreateStudentRequest):
    try:
        hashed = hash_password(data.password)
        create_student(
            std_id=data.std_id,
            std_name=data.std_name,
            email=data.email,
            password_hash=hashed,
            dep_id=data.dep_id,
            subject_ids=data.subject_ids
        )
        return {"message": f"Student '{data.std_name}' registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create student: {str(e)}")

def get_stats():
    return get_system_stats()
