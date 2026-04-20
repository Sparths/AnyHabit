from fastapi import FastAPI


app = FastAPI(title="AnyHabit API")


@app.get("/")
def read_root():
    return {"message": "Willkommen bei AnyHabit! Der Server läuft."}