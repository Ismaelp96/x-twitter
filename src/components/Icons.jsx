'use client';

import {
  HiHeart,
  HiOutlineChat,
  HiOutlineHeart,
  HiOutlineTrash,
} from 'react-icons/hi';
import { signIn, useSession } from 'next-auth/react';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { app } from '@/firebase';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { modalState, postIdState } from '@/atom/modalAtom';

export default function Icons({ id, uid }) {
  const { data: session } = useSession();
  const db = getFirestore(app);

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState([]);
  const [open, setOpen] = useRecoilState(modalState);
  const [postId, setPostId] = useRecoilState(postIdState);
  const [comments, setComments] = useState([]);

  const handlerLikePost = async () => {
    if (session) {
      if (isLiked) {
        await deleteDoc(doc(db, 'posts', id, 'likes', session?.user.uid));
      } else {
        await setDoc(doc(db, 'posts', id, 'likes', session.user.uid), {
          username: session.user.username,
          timestamp: serverTimestamp(),
        });
      }
    } else {
      signIn();
    }
  };

  const handlerDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      if (session?.user?.uid === uid) {
        deleteDoc(doc(db, 'posts', id))
          .then(() => {
            console.log('Document successfully deleted!');
            window.location.reload();
          })
          .catch((error) => {
            console.error('Error removing document:', error);
          });
      } else {
        alert('You are not authorized to delete this post');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'posts', id, 'comments'),
      (snapshot) => {
        setComments(snapshot.docs);
      }
    );
    return () => unsubscribe();
  }, [db, id]);

  useEffect(() => {
    onSnapshot(collection(db, 'posts', id, 'likes'), (snapshot) => {
      setLikes(snapshot.docs);
    });
  }, [db, id]);

  useEffect(() => {
    setIsLiked(
      likes.findIndex((like) => like.id === session?.user?.uid) !== -1
    );
  }, [likes, session?.user?.uid]);

  return (
    <div className='flex items-center justify-start gap-5 p-2 text-gray-500'>
      <div className='flex items-center'>
        <HiOutlineChat
          onClick={() => {
            if (!session) {
              signIn();
            } else {
              setOpen(!open);
              setPostId(id);
            }
          }}
          className='h-9 w-9 cursor-pointer rounded-full transiton duration-500 ease-in-out p-2 hover:text-sky-500 hover:bg-sky-100'
        />
        {comments.length > 0 && (
          <span className={`text-xs ${comments && 'text-sky-600'}`}>
            {comments.length}
          </span>
        )}
      </div>
      <div className='flex items-center'>
        {isLiked ? (
          <HiHeart
            onClick={handlerLikePost}
            className='h-9 w-9 cursor-pointer rounded-full transiton duration-500 text-red-600 ease-in-out p-2 hover:text-gray-300'
          />
        ) : (
          <HiOutlineHeart
            onClick={handlerLikePost}
            className='h-9 w-9 cursor-pointer rounded-full transiton duration-500 ease-in-out p-2 hover:text-red-500 hover:bg-red-100'
          />
        )}
        {likes.length > 0 && (
          <span className={`text-xs ${isLiked && 'text-red-600'}`}>
            {likes.length}
          </span>
        )}
      </div>

      {session?.user?.uid === uid && (
        <HiOutlineTrash
          onClick={handlerDeletePost}
          className='h-8 w-8 cursor-pointer rounded-full transiton duration-500 ease-in-out p-2 hover:text-red-500 hover:bg-red-100'
        />
      )}
    </div>
  );
}
