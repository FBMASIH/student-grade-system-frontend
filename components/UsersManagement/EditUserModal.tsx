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
import { useEffect, useState } from "react";

interface EditUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (
		username: string,
		role: string,
		password?: string,
		firstName?: string,
		lastName?: string
	) => void;
	username: string;
	role: string;
	setUpdateUsername: (username: string) => void;
	setUpdateRole: (role: string) => void;
	setUpdatePassword: (password: string) => void;
	setUpdateFirstName: (firstName: string) => void;
	setUpdateLastName: (lastName: string) => void;
	firstName: string;
	lastName: string;
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

export function EditUserModal({
	isOpen,
	onClose,
	onSubmit,
	username,
	role,
	setUpdateUsername,
	setUpdateRole,
	setUpdatePassword,
	setUpdateFirstName,
	setUpdateLastName,
	firstName,
	lastName,
}: EditUserModalProps) {
	const [password, setPassword] = useState("");

	// Clear password when modal opens
	useEffect(() => {
		if (isOpen) {
			setPassword("");
		}
	}, [isOpen]);

	const handleSubmit = () => {
		onSubmit(username, role, password || undefined, firstName, lastName);
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
							<h3 className="text-lg font-bold">ویرایش کاربر</h3>
							<p className="text-sm text-neutral-500">
								لطفا اطلاعات جدید کاربر را وارد کنید
							</p>
						</ModalHeader>
						<ModalBody>
							<div className="space-y-4">
								<Input
									label="نام کاربری"
									placeholder="نام کاربری را وارد کنید"
									value={username}
									onChange={(e) => setUpdateUsername(e.target.value)}
									variant="bordered"
									classNames={{
										label: "text-right",
										input: "text-right",
									}}
								/>
								<Input
									label="رمز عبور جدید"
									placeholder="رمز عبور جدید را وارد کنید (اختیاری)"
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
									onChange={(e) => setUpdateFirstName(e.target.value)}
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
									onChange={(e) => setUpdateLastName(e.target.value)}
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
									onChange={(e) => setUpdateRole(e.target.value)}
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
												<option.icon className={`w-4 h-4 ${option.color}`} />
											}>
											{option.label}
										</SelectItem>
									))}
								</Select>
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
								className="font-medium bg-gradient-to-r from-primary to-primary-600">
								ذخیره تغییرات
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
