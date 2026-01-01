import { User } from './user.entity';
import { Task } from './task.entity';
import { Curator } from './curator.entity';
import { Country } from './country.entity';
export declare class Student {
    id: string;
    companyId: string;
    userId: string;
    user: User;
    curatorId?: string;
    curator?: Curator;
    fullName: string;
    countryId?: string;
    countries: Country[];
    selectedProgramIds: number[];
    bindingCode?: string;
    telegramGroupId?: string;
    xpTotal: number;
    camundaProcessInstanceId?: string;
    tasks: Task[];
}
