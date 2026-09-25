'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ComponentType } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet, CameraIcon, Close2Icon, ImageBadgeIcon, type IconProps } from '@/app/web_view/_components';
import { MEAL_PHOTOS_KEY, useMe } from '@/app/web_view/_query';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { apiDetail } from '@/lib/api/delivery';
import { uploadMealPhoto } from '@/lib/api/meal';
import { RESTAURANT_IDS, RESTAURANT_NAMES, timeStringToMealType, type MealSlot, type RestaurantId } from '@/lib/types/meal';
import { ChoicePill, MealSegment } from './photoParts';

const MAX_EDGE = 1600;

// Re-encoded: there are no server thumbnails, and it drops the EXIF location.
async function shrink(file: File): Promise<File> {
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
    } catch {
        return file;
    }
}

interface UploadPhotoSheetProps {
    restaurant: RestaurantId | null;
    meal: MealSlot['time'];
    date: string;
    onClose: () => void;
    onUploaded: (meal: MealSlot['time']) => void;
}

export function UploadPhotoSheet({ restaurant, meal, date, onClose, onUploaded }: UploadPhotoSheetProps) {
    return (
        <BottomSheet open={restaurant !== null} onClose={onClose} title="사진 올리기">
            <UploadForm initialRestaurant={restaurant ?? RESTAURANT_IDS[0]} initialMeal={meal} date={date} onUploaded={onUploaded} />
        </BottomSheet>
    );
}

// BottomSheet unmounts children when closed, so each opening starts a fresh form.
function UploadForm({
    initialRestaurant,
    initialMeal,
    date,
    onUploaded,
}: {
    initialRestaurant: RestaurantId;
    initialMeal: MealSlot['time'];
    date: string;
    onUploaded: (meal: MealSlot['time']) => void;
}) {
    const router = useRouter();
    const qc = useQueryClient();
    const me = useMe();
    const [restaurant, setRestaurant] = useState(initialRestaurant);
    const [meal, setMeal] = useState(initialMeal);
    const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const galleryRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    useEffect(() => () => {
        if (picked) URL.revokeObjectURL(picked.url);
    }, [picked]);

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) setPicked({ file, url: URL.createObjectURL(file) });
    };

    const submit = async () => {
        if (!picked || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await uploadMealPhoto({
                restaurant_id: restaurant,
                date,
                meal_time: timeStringToMealType(meal),
                image: await shrink(picked.file),
                comment: comment.trim(),
            });
            qc.invalidateQueries({ queryKey: MEAL_PHOTOS_KEY });
            onUploaded(meal);
        } catch (e) {
            setError(apiDetail(e));
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5 px-5">
            <div className="flex h-[176px] items-center justify-center rounded-[15px] bg-[#F6F6F6]">
                {picked ? (
                    <div className="relative aspect-square h-full overflow-hidden rounded-[12px]">
                        <Image src={picked.url} alt="올릴 사진" fill sizes="176px" className="object-cover" />
                        <button
                            type="button"
                            aria-label="사진 빼기"
                            onClick={() => setPicked(null)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                            <Close2Icon size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-10">
                        <PickButton label="사진" color="bg-ara_red" Icon={ImageBadgeIcon} onClick={() => galleryRef.current?.click()} />
                        <PickButton label="카메라" color="bg-ara_blue" Icon={CameraIcon} onClick={() => cameraRef.current?.click()} />
                    </div>
                )}
            </div>
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />

            <section>
                <h3 className="mb-2 text-[15px] font-semibold text-black">식당</h3>
                <div className="flex flex-wrap gap-2">
                    {RESTAURANT_IDS.map((id) => (
                        <ChoicePill key={id} selected={id === restaurant} onClick={() => setRestaurant(id)}>
                            {RESTAURANT_NAMES[id]}
                        </ChoicePill>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="mb-2 text-[15px] font-semibold text-black">끼니</h3>
                <MealSegment value={meal} onChange={setMeal} />
            </section>

            <div>
                <label className="flex h-12 items-center rounded-[10px] bg-[#F6F6F6] px-4">
                    <input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={200}
                        placeholder="한 줄 후기 (선택)"
                        className="min-w-0 flex-1 bg-transparent text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                    />
                    <span className="ml-2 shrink-0 text-[13px] text-[#BBBBBB]">{comment.length}/200</span>
                </label>
                <p className="mt-2 text-[12px] text-[#999999]">오늘 날짜로 등록돼요</p>
            </div>

            {error && <p className="text-[13px] text-ara_red">{error}</p>}
            {me.isError ? (
                <CtaButton onClick={() => router.push('/web_view/Login')}>로그인하고 올리기</CtaButton>
            ) : (
                <CtaButton disabled={!picked || submitting} onClick={submit}>
                    사진 올리기
                </CtaButton>
            )}
        </div>
    );
}

function PickButton({ label, color, Icon, onClick }: { label: string; color: string; Icon: ComponentType<IconProps>; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
            <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] text-white ${color}`}>
                <Icon size={28} />
            </span>
            <span className="text-[14px] font-medium text-[#333333]">{label}</span>
        </button>
    );
}
