import { Injectable } from "@nestjs/common";

@Injectable()
export class TasksService {
    getTasks() {
        return 'Hello World';
    }
}