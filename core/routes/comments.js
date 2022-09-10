import express from 'express'
import { authenticate } from '../database/tokens.js'
import { validateBody } from '../methods/validate.js'
import { create, get } from '../database/comments.js'
import { get as getToken } from '../database/tokens.js'
import { get as getUser } from '../database/user.js'
import { badRequest } from '../methods/responses.js'

const router = express.Router()
export { router as CommentsRouter }

router.post(
    '/',
    validateBody({ text: true, title: true }),
    authenticate(),
    async (req, res) => {
        const exist = await get('title', req.body.title)
        if (exist) return badRequest(res, 'This title already exist')
        const token = await getToken(
            'accessToken',
            req.headers['authorization'].split(' ')[1]
        )
        const user = await getUser('userId', token.userId)
        const comments = await create(
            user.id,
            username,
            req.body.title,
            req.body.text
        )
    }
)
