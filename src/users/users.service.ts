import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async updateHashedRefreshToken(userId: number, hashedRefreshToken: string) {
    return await this.userRepository.update(
      { id: userId },
      {
        hashedRefreshToken,
      },
    );
  }
  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.create(createUserDto);
    try {
      const result = await this.userRepository.save(user);
      delete result.password;
      return result;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          `Email ${createUserDto.email} is already exists`,
        );
      }
      throw error; // Rethrow for other types of errors
    }
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  async findAll() {
    return await this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
      select: ['name', 'email', 'hashedRefreshToken'],
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
