export async function convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

export const convertFilesToAttachments = async (files: File[]) => {
    return Promise.all(
        files.map(async (file) => ({
            name: file.name,
            contentType: file.type,
            url: await convertFileToBase64(file),
        }))
    );
};
