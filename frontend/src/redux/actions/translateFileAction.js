import {
	TRANSLATEFILE_SUCCESS,
	TRANSLATEFILE_FAIL,
	TRANSLATEFILE_DOCUMENT_SUCCESS,
	TRANSLATEFILE,
	CHANGE_FILE_DOCUMENT,
	CHANGE_OUTPUT,
	CHANGE_OUTPUT_DOCUMENT
} from '../constant/translateFileTypes';
import * as axiosHelper from '../../helpers/axiosHelper';
import { debounce } from 'lodash';

const STATUS = {
	TRANSLATING: 'translating',
	TRANSLATED: 'translated',
	CONVERTING: 'converting',
	CONVERTED: 'converted',
	CANCELLED: 'cancelled',
};

/**
 * @description Thay đổi giá trị
 */
export function changeFileDocument(data) {
	return {
		type: CHANGE_FILE_DOCUMENT,
		payload: {
			file: data,
		}
	};
}

/**
 * @description Thay đổi giá trị
 */
export function changeOutput(data) {
	return {
		type: CHANGE_OUTPUT,
		payload: {
			data,
		}
	};
}

export function changeOutputDocument(data) {
	return {
		type: CHANGE_OUTPUT_DOCUMENT,
		payload: {
			data,
		}
	};
}

export function translationFileLoading() {
	return {
		type: TRANSLATEFILE,
	};
}

/**
 * @description Thành công và trả về kết quả dịch
 */
export function translationFileSuccess(data) {
	return {
		type: TRANSLATEFILE_SUCCESS,
		payload: {
			data,
		}
	};
}

export function translationFileDocumentSuccess(data) {
	return {
		type: TRANSLATEFILE_DOCUMENT_SUCCESS,
		payload: {
			data,
		}
	};
}

/**
 * @description Thành công và trả về err
 */
export function translationFileFailed(err) {
	return {
		type: TRANSLATEFILE_FAIL,
		payload: {
			err,
		}
	};
}

/**
 * @description Do BE bắt fai kiểm tra status 
 * nên sẽ gọi lại API khi nào status được dịch.
 * Đặt thời gian mỗi lần gọi lại API 
 * ! => tránh việc gọi liên tục và ko cần thiết
 */
const recursiveCheckStatus = async (translationHistoryId, taskId, time) => {
	const getTranslationHistoryResult = await axiosHelper.getTranslateHistoryGetSingle({
		translationHistoryId,
		taskId,
	});
	if (getTranslationHistoryResult.data.status !== STATUS.TRANSLATED) {
		return new Promise((resolve, reject) => {
			setTimeout(async () => {
				// 10 * 1000 = 10 sec
				// if (time !== 10) {
				// time += 1;
				try {
					const getTranslationHistoryResult = await recursiveCheckStatus(translationHistoryId, taskId, time);
					resolve(getTranslationHistoryResult);
				} catch (e) {
					reject(e);
				}
				// } else {
				// reject('Time Out');
				// }
			}, 200);
		});
	} else {
		return getTranslationHistoryResult;
	}
};

/**
 * @description Nhập từ input => đợi 1 khoảng thời gian đẻ nhận text
 * ! Tránh việc gọi API ko cần thiêt và liên tục
 */
const debouncedTranslationFile = debounce(async (body, dispatch) => {
	try {
		let time = 1;
		const postTranslationResult = await axiosHelper.translateFile(body);
		const getTranslationFileResult = await recursiveCheckStatus(
			postTranslationResult.data.translationHitoryId,
			postTranslationResult.data.taskId,
			time
		);
		if (getTranslationFileResult.message === 'Time Out') {
			dispatch(translationFileFailed(getTranslationFileResult.message));
		} else {
			const getTranslationResult = await axiosHelper.getTranslateResult(getTranslationFileResult.data.resultUrl);
			if (getTranslationResult.status === 'translated') {
				dispatch(translationFileDocumentSuccess(getTranslationResult));
			} else {
				dispatch(translationFileFailed(getTranslationResult.message));
			}
		}
	} catch (error) {
		dispatch(translationFileFailed(error));
	}
}, 0);

export const translateFileDocumentAsync = (body) => (dispatch) => {
	if (body.get('file') !== null) {
		dispatch(translationFileLoading());
		debouncedTranslationFile(body, dispatch);
	}
};
