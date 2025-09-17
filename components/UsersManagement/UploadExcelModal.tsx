"use client";

import { api } from "@/lib/api";
import {
        Button,
        Card,
        CardBody,
        Chip,
        CircularProgress,
        Input,
        Modal,
        ModalBody,
        ModalContent,
        ModalFooter,
        ModalHeader,
        Table,
        TableBody,
        TableCell,
        TableColumn,
        TableHeader,
        TableRow,
        Select,
        SelectItem,
} from "@nextui-org/react";
import { AlertCircle } from "lucide-react";
import {
        AwaitedReactNode,
        JSXElementConstructor,
        ReactElement,
        ReactNode,
        ReactPortal,
        useState,
} from "react";
import { toast } from "sonner";
import { GroupSelect } from "@/components/GroupSelect";

interface RegisteredUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
}

interface DuplicateUser {
	username: string;
	firstName: string;
	lastName: string;
	message: string;
}

interface ExcelUploadResponse {
	users: RegisteredUser[];
	errors: string[];
	duplicates: DuplicateUser[];
	reactivated: RegisteredUser[];
}

export function UploadExcelModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
        const [isUploading, setIsUploading] = useState(false);
        const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
        const [duplicateUsers, setDuplicateUsers] = useState<DuplicateUser[]>([]);
        const [uploadErrors, setUploadErrors] = useState<string[]>([]);
        const [groupId, setGroupId] = useState("");
        const [role, setRole] = useState("student");
        const [selectedFile, setSelectedFile] = useState<File | null>(null);


        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!groupId) {
                        toast.error("لطفا گروه را انتخاب کنید");
                        return;
                }

                setSelectedFile(file);
                setIsUploading(true);
                setDuplicateUsers([]);
                setUploadErrors([]);

                const formData = new FormData();
                formData.append("file", file);

                try {
                        // Dry run to preview users without saving
                        const { data } = await api.uploadUsersExcel(
                                formData,
                                role,
                                Number(groupId),
                                true
                        );

                        const validUsers = [...(data.users || []), ...(data.reactivated || [])];
                        setRegisteredUsers(validUsers);

                        setDuplicateUsers(data.duplicates || []);
                        setUploadErrors(data.errors || []);
                } catch (err: any) {
                        console.error("Upload error:", err);
                        toast.error(err.response?.data?.message || "خطا در آپلود فایل");
                        setRegisteredUsers([]);
                } finally {
                        setIsUploading(false);
                }
        };

        const handleConfirmUpload = async () => {
                if (!selectedFile) {
                        toast.error("فایلی انتخاب نشده است");
                        return;
                }

                if (!groupId) {
                        toast.error("لطفا گروه را انتخاب کنید");
                        return;
                }

                setIsUploading(true);

                const formData = new FormData();
                formData.append("file", selectedFile);

                try {
                        const { data } = await api.uploadUsersExcel(
                                formData,
                                role,
                                Number(groupId)
                        );

                        const validUsers = [...(data.users || []), ...(data.reactivated || [])];
                        if (validUsers.length > 0) {
                                toast.success(`${validUsers.length} کاربر با موفقیت افزوده شد`);
                        }

                        data.duplicates?.forEach(
                                (d: { firstName: any; lastName: any; username: any; message: any }) => {
                                        toast.warning(
                                                `${d.firstName} ${d.lastName} (${d.username}): ${d.message}`
                                        );
                                }
                        );

                        data.errors?.forEach((error: any) => {
                                toast.error(error);
                        });

                        onClose();
                        setRegisteredUsers([]);
                        setDuplicateUsers([]);
                        setUploadErrors([]);
                        setGroupId("");
                        setRole("student");
                        setSelectedFile(null);
                } catch (err: any) {
                        console.error("Upload error:", err);
                        toast.error(err.response?.data?.message || "خطا در ثبت کاربران");
                } finally {
                        setIsUploading(false);
                }
        };

        return (
                <Modal
                        isOpen={isOpen}
                        onClose={() => {
                                setGroupId("");
                                setRole("student");
                                setRegisteredUsers([]);
                                setDuplicateUsers([]);
                                setUploadErrors([]);
                                setSelectedFile(null);
                                onClose();
                        }}
                        size="4xl">
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							<h3 className="text-lg font-bold">افزودن کاربران از فایل اکسل</h3>
							<p className="text-sm text-neutral-500">
								فایل اکسل باید شامل ستون username باشد
							</p>
						</ModalHeader>
						<ModalBody>
							<div className="space-y-4">
                                                                <GroupSelect value={groupId} onChange={setGroupId} />
                                                                <Select
                                                                        label="نقش کاربران"
                                                                        selectedKeys={[role]}
                                                                        onChange={(e) => setRole(e.target.value)}
                                                                        className="text-right">
                                                                        <SelectItem key="student" value="student">
                                                                                دانشجو
                                                                        </SelectItem>
                                                                        <SelectItem key="teacher" value="teacher">
                                                                                استاد
                                                                        </SelectItem>
                                                                        <SelectItem key="admin" value="admin">
                                                                                مدیر سیستم
                                                                        </SelectItem>
                                                                </Select>
                                                                <Card className="border border-neutral-200 dark:border-neutral-800">
                                                                        <CardBody className="p-4">
                                                                                <Input
                                                                                        type="file"
                                                                                        accept=".xlsx,.xls,.csv"
                                                                                        onChange={handleFileChange}
                                                                                        disabled={isUploading}
                                                                                        description="فرمت‌های مجاز: Excel (.xlsx, .xls) و CSV"
                                                                                        classNames={{
                                                                                                input: "cursor-pointer",
                                                                                        }}
                                                                                        aria-label="انتخاب فایل اکسل کاربران"
                                                                                />
                                                                        </CardBody>
                                                                </Card>

								{isUploading && (
									<div className="flex flex-col items-center gap-2 py-8">
										<CircularProgress aria-label="Loading..." />
										<p className="text-sm text-neutral-600">
											در حال پردازش فایل...
										</p>
									</div>
								)}

								{/* Display Errors */}
								{uploadErrors.length > 0 && (
									<Card className="border-danger">
										<CardBody>
											<div className="flex items-center gap-2 mb-2">
												<AlertCircle className="w-5 h-5 text-danger" />
												<h4 className="font-medium text-danger">خطاها</h4>
											</div>
											<ul className="list-disc list-inside space-y-1">
												{uploadErrors.map((error, index) => (
													<li key={index} className="text-danger text-sm">
														{error}
													</li>
												))}
											</ul>
										</CardBody>
									</Card>
								)}

								{/* Display Duplicates */}
								{duplicateUsers.length > 0 && (
									<Card className="border-warning">
										<CardBody>
											<div className="flex items-center gap-2 mb-2">
												<AlertCircle className="w-5 h-5 text-warning" />
												<h4 className="font-medium text-warning">
													کاربران تکراری
												</h4>
											</div>
											<Table
												removeWrapper
												aria-label="لیست کاربران تکراری"
												classNames={{
													base: "max-h-[200px] overflow-auto",
												}}>
												<TableHeader>
													<TableColumn>نام کاربری</TableColumn>
													<TableColumn>نام</TableColumn>
													<TableColumn>نام خانوادگی</TableColumn>
													<TableColumn>پیام</TableColumn>
												</TableHeader>
												<TableBody>
													{duplicateUsers.map((user, index) => (
														<TableRow key={index}>
															<TableCell>{user.username}</TableCell>
															<TableCell>{user.firstName}</TableCell>
															<TableCell>{user.lastName}</TableCell>
															<TableCell>
																<Chip color="warning" size="sm" variant="flat">
																	{user.message}
																</Chip>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</CardBody>
									</Card>
								)}

								{/* Display Valid Users */}
								{registeredUsers.length > 0 && (
									<Card className="border border-neutral-200 dark:border-neutral-800">
										<CardBody className="p-0">
											<div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
												<div className="flex items-center justify-between">
													<p className="text-success-600 font-medium">
														{registeredUsers.length} دانشجو استخراج شده
													</p>
												</div>
											</div>
											<div className="max-h-[400px] overflow-auto">
												<Table
													removeWrapper
													aria-label="لیست دانشجویان"
													classNames={{
														base: "min-h-[200px]",
													}}>
													<TableHeader>
														<TableColumn>نام کاربری</TableColumn>
														<TableColumn>نام</TableColumn>
														<TableColumn>نام خانوادگی</TableColumn>
													</TableHeader>
													<TableBody>
														{registeredUsers.map((user) => (
															<TableRow key={user.username}>
																<TableCell>{user.username}</TableCell>
																<TableCell>{user.firstName}</TableCell>
																<TableCell>{user.lastName}</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</CardBody>
									</Card>
								)}
							</div>
						</ModalBody>
                                                <ModalFooter>
                                                        <Button color="danger" variant="light" onPress={onClose}>
                                                                انصراف
                                                        </Button>
                                                        {registeredUsers.length > 0 && (
                                                                <Button
                                                                        color="primary"
                                                                        onPress={handleConfirmUpload}
                                                                        isLoading={isUploading}
                                                                        isDisabled={isUploading}>
                                                                        تایید و افزودن کاربران
                                                                </Button>
                                                        )}
                                                </ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
