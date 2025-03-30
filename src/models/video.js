import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const Schema = mongoose.Schema;

const videoSchema = new Schema({
    videoFile: {
        type: String, //cloudinary url
        required: true
    },
    thumbnail: {
        type: String, //cloudinary url
        requried: true
    },
    description: {
        type: String, //cloudinary url
        requried: true
    },
    duration: {
        type: Number, //cloudinary
        requried: true
    },
    views: {
        type: Number, 
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('Video', videoSchema);
