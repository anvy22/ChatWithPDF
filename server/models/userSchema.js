import mongoose from "mongoose";


const userSchema = new mongoose.Schema({    
    userId:{
        type: String,
        required: true,
        unique: true,
    },
        pdfs:[{
           pdfName: {
                type: String,
                required: true, 

            },
            pdfPath: {
                type: String,
                required: true,
            },
            uploadedDate: {
                type: Date,
                default: Date.now,
            },
        }],
        sessions: [{
            sessionId: {
                type: mongoose.Schema.Types.ObjectId,ref: 'Session',
                required: true,
            
            },
            sessionName: {
                type: String,
                required: true,
            },
            sessionDate: {
                type: Date,
                default: Date.now,
            },
        }],

})

const User = mongoose.model("User", userSchema);
export default User;