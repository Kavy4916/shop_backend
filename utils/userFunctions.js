import mongoose from "mongoose";

const validateId = (_id,res)=>{
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Bad Request" });
  }
}
export { validateId};