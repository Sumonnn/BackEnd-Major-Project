const { instance } = require("../config/razorpay");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentTemplate } = require("../mail/templates/courseEnrollmentTemplate");
const mongoose = require("mongoose");



//capture the payment and instance the Razorpay order
exports.capturePayment = async (req, res) => {
    try {
        //get courseID and UserID
        const { course_id } = req.body;
        const userId = req.user.id;
        //validation
        //valid courseID
        if (!course_id) {
            return res.status(401).json({
                success: false,
                message: "Please provide valid course ID",
            })
        }
        //valid courseDetail
        const courseDetails = await Course.findById(course_id);
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Cloud not find the course",
            });
        }
        //user already pay for the same course
        const uid = new mongoose.Types.ObjectId(userId);
        if (courseDetails.studentsEnrolled.includes(uid)) {
            return res.status(400).json({
                success: false,
                message: "Student is already enrolled",
            });
        }
        //order create 
        const amount = courseDetails.price;
        const currency = "INR";

        const options = {
            amount: amount * 100,
            currency,
            receipt: Math.random(Date.now()).toString(),
            notes: {
                courseId: course_id,
                userId,
            }
        };

        try {
            //initiate the payment using razorpay
            const paymentResponse = await instance.orders.create(options);
            console.log("response the payment " + paymentResponse);

            //return response
            return res.status(200).json({
                success: true,
                courseName: courseDetails.courseName,
                courseDescription: courseDetails.courseDescription,
                thumbnail: courseDetails.thumbnail,
                orderId: paymentResponse.id,
                currency: paymentResponse.currency,
                amount: paymentResponse.amount,
            })

        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Cloud not initiate order"
            })
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//verify Signature of Razorpay and server
exports.verifySignature = async (req, res) => {
    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (signature === digest) {
        console.log("Payment is Authorised");

        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try {
            //fulfill the action

            //find the course and enroll the student in it
            const enrolledCourse = await Course.findByIdAndUpdate(
                { _id: courseId },
                {
                    $push: { studentsEnrolled: userId }
                },
                { new: true },
            );

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course not Found",
                })
            }

            console.log("updated course " + enrolledCourse);


            //find the student added the course to their list enrolled courses me

            const enrolledStudent = await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $push: { courses: courseId }
                },
                { new: true }
            )

            console.log("Enrolled Student " + enrolledStudent);

            //mail send krdo confirmation wala
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congraturations",
                "welcome to studynotion new course testing mode"
            )

            console.log("Email sent successfully: ", emailResponse.response)

            return res.status(200).json({
                success: true,
                message: "Signture verified and Course Added",
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid request ",
        })
    }
}