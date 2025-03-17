import { useTranslation } from 'react-i18next';

const MyActivity = () => {
    const { t } = useTranslation();
    return (
        <div>
            <div className="grid grid-cols-3 w-full text-center"> 
                <div className="flex flex-col">
                    <div className="text-xs my-2">{t('게시글')}</div>
                    <div className="text-lg mb-2">{(t('ranking-posts-count'), "1개")}</div>
                </div>
                <div className="flex flex-col border-l border-gray-400">
                    <div className="text-xs my-2">{t('comments')}</div>
                    <div className="text-lg mb-2">{(t('ranking-comments-count'), 2)}</div>
                </div>
                <div className="flex flex flex-col border-l border-gray-400">
                    <div className="text-xs my-2">{t('likes')}</div>
                    <div className="text-lg mb-2">{(t('ranking-likes-count'), 3)}</div>
                </div>
            </div>
        </div>
    );
};

export default MyActivity;