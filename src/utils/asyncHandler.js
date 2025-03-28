const asyncHandler = (requestsHandler) => {
    (req, res, next) => {
        Promise.resolve(requestsHandler(req, res, next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}