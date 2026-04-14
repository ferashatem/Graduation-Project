// // src/utils/uploadFile.js
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../firebase"; // adjust the path if needed

// export const uploadFileAndGetURL = async (file, folder = "income-files") => {
//   const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
//   await uploadBytes(fileRef, file);
//   const url = await getDownloadURL(fileRef);
//   return url;
// };
