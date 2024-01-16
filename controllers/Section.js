const Section = require("../models/sectionModel");
const Course = require("../models/courseModel");

exports.createSection = async (req, res) => {
    try {
        //data fetch
        const { sectionName, courseId } = req.body;
        //data validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties",
            });
        }
        //create section
        const newSection = await Section.create({ sectionName });
        //update course with section objectID
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId,
            {
                $push: {
                    courseContent: newSection._id,
                }
            },
            { new: true }
        )
        //TODO:use populate to replace sections/sub-sections both in the updatedCourseDetails
        //return response 
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to create Section , please try again",
            error: error.message,
        })
    }
}

exports.updateSection = async (req, res) => {
    try {
        //data fetch
        const { sectionName, sectionId } = req.body;
        //data validation
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties",
            });
        }

        //update data
        const section = await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

        //retrun res
        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update Section , please try again",
            error: error.message,
        })
    }
}

exports.deleteSection = async (req, res) => {
    try {
        //get ID - assuming that we are sending ID in params
        const { sectionId } = req.params;
        //use findByIdAnddelete
        await Section.findByIdAndDelete(sectionId);
        //TODO[testing]:do we need to delete the entry from the course Schema??
        //return response
        return res.status(200).json({
            success: true,
            message: "Section deleted Successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete Section , please try again",
            error: error.message,
        })
    }
}