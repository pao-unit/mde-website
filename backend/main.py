import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

from MDE import MDE
from patch import reset_argv

app = FastAPI()

api = APIRouter(prefix="/api")


class Item(BaseModel):
    id: int = Field(examples=[1, 2, 3])
    name: str = Field(examples=["Item1", "Item2", "Item3"])
    description: str | None = Field(
        default=None, examples=["A sample item", "Another item description"]
    )


@api.put("/items/{item_id}")
async def update_item(item_id: int, item: Item, skip_id_check: bool = False):
    if not skip_id_check and item_id != item.id:
        raise HTTPException(status_code=400, detail="Item ID mismatch")
    return {"item_id": item_id, "item": item}


@api.post("/test-run")
async def test_run():
    df = pd.read_csv("./MDE/data/Fly80XY_norm_1061.csv")

    with reset_argv():
        mde = MDE(
            df,
            target="FWD",
            removeColumns=["index", "FWD", "Left_Right"],
            D=10,
            lib=[1, 300],
            pred=[301, 600],
            cores=10,
            plot=False,
            title="MDE FWD",
        )

        mde.Run()

        return {"result": mde.MDEOut}


app.include_router(api)
