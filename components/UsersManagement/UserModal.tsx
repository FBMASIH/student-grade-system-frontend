"use client";

import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
} from "@nextui-org/react";
import { GraduationCap, School, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { GroupSelect } from "@/components/GroupSelect";

interface UserModalProps {
	isOpen: boolean;
	onClose: () => void;
        onSubmit: (
                username: string,
                password: string,
                firstName: string,
                lastName: string,
                role: string,
                groupId: number
        ) => void;
}

const roleOptions = [
	{
		label: "دانشجو",
		value: "student",
		icon: GraduationCap,
		color: "text-blue-500",
	},
	{
		label: "استاد",
		value: "teacher",
		icon: School,
		color: "text-amber-500",
	},
	{
		label: "مدیر",
		value: "admin",
		icon: ShieldCheck,
		color: "text-purple-500",
	},
];

export function UserModal({ isOpen, onClose, onSubmit }: UserModalProps) {
        const [username, setUsername] = useState("");
        const [password, setPassword] = useState("");
        const [firstName, setFirstName] = useState("");
        const [lastName, setLastName] = useState("");
        const [role, setRole] = useState("student");
        const [groupId, setGroupId] = useState("");

        const handleSubmit = () => {
                if (!username || !password || !firstName || !lastName || !role || !groupId)
                        return;
                onSubmit(
                        username,
                        password,
                        firstName,
                        lastName,
                        role,
                        Number(groupId)
                );
                setUsername("");
                setPassword("");
                setFirstName("");
                setLastName("");
                setRole("student");
                setGroupId("");
        };

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			classNames={{
				base: "border-2 border-neutral-200 dark:border-neutral-800",
				header: "border-b border-neutral-200 dark:border-neutral-800",
				body: "py-6",
				footer: "border-t border-neutral-200 dark:border-neutral-800",
			}}>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							<h3 className="text-lg font-bold">افزودن کاربر جدید</h3>
							<p className="text-sm text-neutral-500">
								لطفا اطلاعات کاربر جدید را وارد کنید
							</p>
						</ModalHeader>
						<ModalBody>
							<div className="space-y-4">
								<Input
									label="نام کاربری"
									placeholder="نام کاربری را وارد کنید"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									variant="bordered"
									classNames={{
										label: "text-right",
										input: "text-right",
									}}
								/>
								<Input
									label="رمز عبور"
									placeholder="رمز عبور را وارد کنید"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									variant="bordered"
									classNames={{
										label: "text-right",
										input: "text-right",
									}}
								/>
								<Input
									label="نام"
									placeholder="نام را وارد کنید"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									variant="bordered"
									classNames={{
										label: "text-right",
										input: "text-right",
									}}
								/>
								<Input
									label="نام خانوادگی"
									placeholder="نام خانوادگی را وارد کنید"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									variant="bordered"
									classNames={{
										label: "text-right",
										input: "text-right",
									}}
								/>
                                                                <Select
                                                                        label="نقش کاربر"
                                                                        placeholder="نقش کاربر را انتخاب کنید"
                                                                        selectedKeys={[role]}
                                                                        onChange={(e) => setRole(e.target.value)}
                                                                        variant="bordered"
                                                                        classNames={{
                                                                                label: "text-right",
                                                                                value: "text-right",
                                                                                trigger: "h-12",
                                                                        }}>
                                                                        {roleOptions.map((option) => (
                                                                                <SelectItem
                                                                                        key={option.value}
                                                                                        value={option.value}
                                                                                        startContent={
                                                                                                <option.icon
                                                                                                        className={`w-4 h-4 ${option.color}`}
                                                                                                />
                                                                                        }>
                                                                                        {option.label}
                                                                                </SelectItem>
                                                                        ))}
                                                                </Select>
                                                                <GroupSelect value={groupId} onChange={setGroupId} />
                                                        </div>
                                                </ModalBody>
						<ModalFooter>
							<Button
								color="danger"
								variant="light"
								onPress={onClose}
								className="font-medium">
								انصراف
							</Button>
							<Button
								color="primary"
								variant="shadow"
								onPress={handleSubmit}
								className="font-medium bg-gradient-to-r from-primary to-primary-600"
								isDisabled={
									!username || !password || !firstName || !lastName || !role
								}>
								افزودن کاربر
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
