import { validationResult } from "express-validator";

/**
 * Validate request using express-validator rules
 */
export const validate = (rules = []) => {
    return async (req, res, next) => {
        // Run all validation rules
        for (const rule of rules) {
            await rule.run(req);
        }

        // Collect validation errors
        const errors = validationResult(req);

        // If no errors, continue
        if (errors.isEmpty()) {
            return next();
        }

        // Format errors: field -> message
        const formattedErrors = {};
        for (const err of errors.array()) {
            if (!formattedErrors[err.path]) {
                formattedErrors[err.path] = err.msg;
            }
        }

        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: formattedErrors,
        });
    };
};
