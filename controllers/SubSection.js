const SubSection = require("../models/subSectionModel");
const Section = require("../models/sectionModel");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

require("dotenv").config();

//create SubSection
exports.createSubSection = async (req, res) => {
    try {
        //fetch data from Req body
        const { sectionId, title, timeDuration, description } = req.body;
        //extract file/video
        const video = req.files.videoFile;
        //validation
        if (!sectionId || !title || !timeDuration || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)
        //create a sub section
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })
        //update section with this sub section Object ID
        const UpdatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $push: {
                    subSection: SubSectionDetails._id,
                }
            },
            { new: true }
        )
        //TODO: log updated section here , after adding populate query
        //return response
        return res.status(200).json({
            success: true,
            message: "Sub Section Created Successfully",
            UpdatedSection,
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server Error",
            error: error.message,
        })
    }
}


//TODO : updatedSubSection


//TODO : DeletedSubSection