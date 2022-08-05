/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useState } from 'react';
import { FaCalendar, FaUser } from 'react-icons/fa';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [pages, setPages] = useState([]);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function getPage(uri: string) {
    fetch(uri)
      .then(response => response.json())
      .then(data => {
        const dataFormated = data.results.map(item => {
          return {
            uid: item.uid,
            first_publication_date: format(
              new Date(item.first_publication_date),
              "d ' ' MMM ' ' y",
              {
                locale: ptBR,
              }
            ),
            data: {
              title: item.data.title,
              subtitle: item.data.title,
              author: item.data.author,
            },
          };
        });
        const newPage = [...pages];
        dataFormated.map(item => newPage.push(item));

        setNextPage(data.next_page);
        setPages(newPage);
      });
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {postsPagination.results.map(post => {
          return (
            <div className={styles.post} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                </a>
              </Link>
              <p>{post.data.subtitle}</p>
              <time>
                <FaCalendar /> {post.first_publication_date}
              </time>
              <span>
                <FaUser className="icon" /> {post.data.author}
              </span>
            </div>
          );
        })}

        {!pages
          ? ''
          : pages.map(post => {
              return (
                <div className={styles.post} key={post.uid}>
                  <Link href={`/post/${post.uid}`}>
                    <a>
                      <h1>{post.data.title}</h1>
                    </a>
                  </Link>
                  <p>{post.data.subtitle}</p>
                  <time>
                    <FaCalendar /> {post.first_publication_date}
                  </time>
                  <span>
                    <FaUser className="icon" /> {post.data.author}
                  </span>
                </div>
              );
            })}
        {!nextPage ? (
          ''
        ) : (
          <button type="button" onClick={() => getPage(nextPage)}>
            Carregar mais psts
          </button>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 2 });
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "d ' ' MMM ' ' y",
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.title,
        author: post.data.author,
      },
    };
  });

  return {
    revalidate: 60 * 30, // 30 minutos
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
