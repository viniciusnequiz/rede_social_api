import express from 'express'
import { authenticate, get as getToken } from '../database/tokens.js'
import { create, get, getAll, getAndUpdate } from '../database/user.js'
import { autoComplete } from '../methods/autoComplete.js'
import { badRequest } from '../methods/responses.js'

const router = new express.Router()
export { router as UserRouter }

router.post('/', async (req, res) => {
    const exist = await get('username', req.body.username)
    if (exist != undefined) badRequest(res, 'This user already exist', 400)
    else {
        const user = await create(
            req.body.username,
            req.body.password,
            req.body.email
        )
        res.status(200).json(user)
    }
})
router.get('/', authenticate(), async (req, res) => {
    const name = req.query.name || ''
    const auto = autoComplete(name, await getAll(), 'username')
    res.status(200).json(auto)
})

router.get('/perfil', authenticate(), async (req, res) => {
    if (!req.query.name) return badRequest(res, 'where is the name?', 400)
    const user = await get('username', req.query.name)
    res.status(200).json(user)
})

router.post('/follower', authenticate(), async (req, res) => {
    const token = await getToken(
        'accessToken',
        req.headers['authorization'].split(' ')[1]
    )
    if (!token) return badRequest(res, 'Something is wrong', 400)
    const user = await get('username', req.body.user)
    const following = await get('userId', token['userId'])
    if (user['posts'].includes(token['userId']))
        return badRequest(res, 'already following', 200)
    following['following'].push(user['_id'])
    user['follower'].push(token['userId'])
    await getAndUpdate(
        { username: req.body.user },
        { follower: user['follower'] }
    )
    await getAndUpdate(
        { username: following['username'] },
        { following: following['following'] }
    )
    res.status(200).json({ message: 'add new follower!' })
})

router.delete('/follower', authenticate(), async (req, res) => {
    const token = await getToken(
        'accessToken',
        req.headers['authorization'].split(' ')[1]
    )
    const user = await get('username', req.body.user)
    const following = await get('userId', token['userId'])
    if (!user['posts'].includes(token['userId']))
        return badRequest(res, 'already unfolloing', 200)
    const indexFollowing = following['following'].indexOf(user['_id'])
    const indexUser = user['follower'].indexOf(token['userId'])
    following['following'].splice(indexFollowing, 1)
    user['follower'].splice(indexUser, 1)
    await getAndUpdate(
        { username: req.body.user },
        { follower: user['follower'] }
    )
    await getAndUpdate(
        { username: following['username'] },
        { following: following['following'] }
    )
})
