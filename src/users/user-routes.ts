import { Router, Request, Response } from 'express';
import { getUserService } from './user-cache-singleton';
import { CreateUserRequest } from './types';
import { UserNotFoundError, InvalidUserDataError } from './errors';

const userRouter: Router = Router();

userRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    const userService = getUserService();
    const user = await userService.getUserById(userId);

    return res.json({ data: user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

userRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userData: CreateUserRequest = req.body;

    // Basic validation
    if (!userData.name || !userData.email) {
      return res.status(400).json({
        error: 'Name and email are required',
        code: 'INVALID_USER_DATA',
      });
    }

    const userService = getUserService();
    const newUser = await userService.createUser(userData);

    return res.status(201).json({ data: newUser });
  } catch (error) {
    if (error instanceof InvalidUserDataError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default userRouter;
