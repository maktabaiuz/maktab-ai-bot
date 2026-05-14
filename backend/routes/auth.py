from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import hashlib, hmac, os
from urllib.parse import unquote

from database import get_db
from models import User, Student

router = APIRouter()


class TelegramAuthRequest(BaseModel):
    init_data: str
    name: str | None = None
    grade: int | None = None


def verify_telegram_init_data(init_data: str) -> dict | None:
    """Verify Telegram WebApp initData signature."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not bot_token or not init_data:
        return None

    try:
        params = dict(pair.split("=", 1) for pair in init_data.split("&") if "=" in pair)
        received_hash = params.pop("hash", "")
        data_check = "\n".join(f"{k}={unquote(v)}" for k, v in sorted(params.items()))
        secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, received_hash):
            return None
        import json
        user_raw = params.get("user", "{}")
        return json.loads(unquote(user_raw))
    except Exception:
        return None


@router.post("/auth/telegram")
async def auth_telegram(body: TelegramAuthRequest, db: Session = Depends(get_db)):
    # In dev mode, skip signature check
    user_data = verify_telegram_init_data(body.init_data)
    is_dev = os.getenv("DEV_MODE", "false").lower() == "true"

    if not user_data and not is_dev:
        raise HTTPException(status_code=401, detail="Invalid Telegram auth")

    # Dev fallback
    if not user_data:
        user_data = {"id": 0, "first_name": "Test", "last_name": "User"}

    telegram_id = user_data.get("id", 0)
    name = user_data.get("first_name", "") + " " + user_data.get("last_name", "")
    name = name.strip()

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id, name=name, role="student")
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create or update student record if grade provided
    student = None
    if body.grade:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            student = Student(
                user_id=user.id,
                name=body.name or name,
                grade=body.grade,
            )
            db.add(student)
        else:
            if body.grade:
                student.grade = body.grade
            if body.name:
                student.name = body.name
        db.commit()
        db.refresh(student)

    return {
        "user_id": user.id,
        "student_id": student.id if student else None,
        "name": user.name,
        "role": user.role,
    }
