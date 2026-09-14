from fastapi import HTTPException, status
from app.model.schemas import (
    CreateDepartmentRequest,
    CreateSubjectRequest,
    CreateTeacherRequest,
    UpdateTeacherRequest,
    CreateStudentRequest
)
from app.model.admin_model import (
    get_all_departments,
    create_department,
    create_department_with_subjects,
    update_department,
    delete_department,
    get_all_subjects,
    create_subject,
    update_subject,
    delete_subject,
    link_department_subject,
    get_all_teachers,
    get_next_teacher_id,
    check_teacher_id_exists,
    create_teacher,
    update_teacher,
    delete_teacher,
    get_all_students,
    create_student,
    get_system_stats
)
from app.helper.password import hash_password

def list_departments():
    return get_all_departments()

def add_department(data: CreateDepartmentRequest):
    try:
        subject_names = list(dict.fromkeys(
            name.strip() for name in (data.subject_names or []) if name.strip()
        ))
        result = create_department_with_subjects(data.dep_name.strip(), subject_names)
        return {
            "message": (
                "Department created successfully. "
                f"{len(subject_names)} subject(s) linked."
            ),
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create department: {str(e)}")

def edit_department(dep_id: int, data: CreateDepartmentRequest):
    try:
        if not update_department(dep_id, data.dep_name):
            raise HTTPException(status_code=404, detail="Department not found")
        return {"message": "Department updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update department: {str(e)}")

def remove_department(dep_id: int):
    try:
        result = delete_department(dep_id)
        if not result["department_deleted"]:
            raise HTTPException(status_code=404, detail="Department not found")
        return {
            "message": (
                "Department deleted successfully. "
                f"{result['subjects_deleted']} linked subject(s) were also deleted."
            )
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete department: {str(e)}")

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

def edit_subject(sub_id: int, data: CreateSubjectRequest):
    try:
        if not update_subject(sub_id, data.sub_name, data.dep_id):
            raise HTTPException(status_code=404, detail="Subject not found")
        return {"message": "Subject updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update subject: {str(e)}")

def remove_subject(sub_id: int):
    try:
        if not delete_subject(sub_id):
            raise HTTPException(status_code=404, detail="Subject not found")
        return {"message": "Subject deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Subject cannot be deleted while it is used by an assignment."
        )

def list_teachers():
    return get_all_teachers()

def fetch_next_teacher_id():
    return get_next_teacher_id()

def check_teach_id_availability(teach_id: str) -> bool:
    return check_teacher_id_exists(teach_id)

def add_teacher(data: CreateTeacherRequest):
    try:
        clean_teach_id = data.teach_id.strip()
        if check_teacher_id_exists(clean_teach_id):
            raise HTTPException(
                status_code=400,
                detail=f"Staff ID '{clean_teach_id}' already exists in database. Please enter a different ID."
            )

        hashed = hash_password(data.password)
        create_teacher(
            teach_id=clean_teach_id,
            teach_name=data.teach_name.strip(),
            email=data.email.strip().lower(),
            password_hash=hashed,
            subject_ids=data.subject_ids
        )
        return {"message": f"Teacher '{data.teach_name}' registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create teacher: {str(e)}")

def edit_teacher(teach_id: str, data: UpdateTeacherRequest):
    try:
        clean_name = data.teach_name.strip()
        clean_email = data.email.strip().lower()
        hashed = hash_password(data.password) if data.password else None
        
        success = update_teacher(
            teach_id=teach_id.strip(),
            teach_name=clean_name,
            email=clean_email,
            password_hash=hashed,
            subject_ids=data.subject_ids
        )
        if not success:
            raise HTTPException(status_code=404, detail="Teacher not found")
        return {"message": f"Teacher '{clean_name}' updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update teacher: {str(e)}")

def remove_teacher(teach_id: str):
    try:
        delete_teacher(teach_id.strip())
        return {"message": "Teacher deleted successfully"}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete teacher: {str(e)}")

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
