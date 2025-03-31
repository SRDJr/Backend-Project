export const asyncHandler = (requestsHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestsHandler(req, res, next))
        .catch((err) => next(err))
    }
}
