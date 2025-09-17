import { Button } from "@nextui-org/button";
import { useRef } from "react";

interface FileUploaderProps {
	onFileSelect: (file: File) => void | Promise<void>;
	accept?: string;
	isDisabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
	onFileSelect,
	accept,
	isDisabled,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			await Promise.resolve(onFileSelect(file));
			// Reset the input value so the same file can be uploaded again
			event.target.value = "";
		}
	};

	return (
		<>
                        <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept={accept}
                                style={{ display: "none" }}
                                aria-label="انتخاب فایل برای آپلود"
                        />
			<Button
				color="primary"
				variant="flat"
				onPress={handleClick}
				isDisabled={isDisabled}>
				آپلود فایل اکسل
			</Button>
		</>
	);
};
