import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface TaskCompletion {
    completedAt: Time;
    taskTitle: string;
    taskId: bigint;
    coinsEarned: bigint;
}
export interface Reward {
    id: bigint;
    name: string;
    coinCost: bigint;
}
export interface Redemption {
    id: bigint;
    coinsSpent: bigint;
    rewardType: {
        __kind__: "customReward";
        customReward: bigint;
    } | {
        __kind__: "screenTime";
        screenTime: bigint;
    };
    timestamp: Time;
}
export interface Task {
    id: bigint;
    completedAt?: Time;
    title: string;
    repeatOption: {
        __kind__: "custom";
        custom: bigint;
    } | {
        __kind__: "never";
        never: null;
    } | {
        __kind__: "daily";
        daily: null;
    } | {
        __kind__: "weekly";
        weekly: null;
    };
    coinReward: bigint;
    isActive: boolean;
    taskType: {
        __kind__: "custom";
        custom: string;
    } | {
        __kind__: "pushups";
        pushups: null;
    } | {
        __kind__: "situps";
        situps: null;
    };
    targetReps: bigint;
    priority: boolean;
}
export interface UserProfile {
    coinBalance: bigint;
    onboardingComplete: boolean;
    lastDebtResetDate: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addReward(name: string, coinCost: bigint): Promise<bigint>;
    addTask(title: string, taskType: {
        __kind__: "custom";
        custom: string;
    } | {
        __kind__: "pushups";
        pushups: null;
    } | {
        __kind__: "situps";
        situps: null;
    }, targetReps: bigint, coinReward: bigint, repeatOption: {
        __kind__: "custom";
        custom: bigint;
    } | {
        __kind__: "never";
        never: null;
    } | {
        __kind__: "daily";
        daily: null;
    } | {
        __kind__: "weekly";
        weekly: null;
    }, priority: boolean): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeTask(taskId: bigint): Promise<void>;
    deleteReward(rewardId: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProfile(): Promise<UserProfile>;
    getRedemptionHistory(): Promise<Array<Redemption>>;
    getRewards(): Promise<Array<Reward>>;
    getTaskCompletionHistory(): Promise<Array<TaskCompletion>>;
    getTasks(): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markOnboardingComplete(): Promise<void>;
    redeemCustomReward(rewardId: bigint): Promise<void>;
    redeemScreenTime(minutes: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateReward(rewardId: bigint, name: string, coinCost: bigint): Promise<void>;
    updateTask(taskId: bigint, title: string, taskType: {
        __kind__: "custom";
        custom: string;
    } | {
        __kind__: "pushups";
        pushups: null;
    } | {
        __kind__: "situps";
        situps: null;
    }, targetReps: bigint, coinReward: bigint, repeatOption: {
        __kind__: "custom";
        custom: bigint;
    } | {
        __kind__: "never";
        never: null;
    } | {
        __kind__: "daily";
        daily: null;
    } | {
        __kind__: "weekly";
        weekly: null;
    }, priority: boolean, isActive: boolean): Promise<void>;
}
