import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { resetDialogEnqueue, setDialogEnqueue, type DialogRequest, type EnqueueFn } from './appDialog';

const AppDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);

  const activeDialog = useMemo(() => queue[0] ?? null, [queue]);

  useEffect(() => {
    const enqueue: EnqueueFn = (request) => {
      setQueue((prev) => [...prev, request]);
    };

    setDialogEnqueue(enqueue);

    const originalAlert = window.alert.bind(window);
    window.alert = (message?: unknown) => {
      enqueue({
        kind: 'alert',
        message: String(message ?? ''),
        title: '안내',
      });
    };

    return () => {
      resetDialogEnqueue();
      window.alert = originalAlert;
    };
  }, []);

  const closeActive = (confirmed: boolean) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [current, ...rest] = prev;
      if (current.kind === 'confirm') {
        current.resolve?.(confirmed);
      }
      return rest;
    });
  };

  return (
    <>
      {children}
      {activeDialog && (
        <>
          <Backdrop
            onClick={() => {
              if (activeDialog.kind === 'confirm') {
                closeActive(false);
                return;
              }
              closeActive(true);
            }}
          />
          <Modal role="dialog" aria-modal="true" aria-label={activeDialog.title ?? '안내'}>
            <Body>
              <Title>{activeDialog.title ?? (activeDialog.kind === 'confirm' ? '확인' : '안내')}</Title>
              <Message>{activeDialog.message}</Message>
            </Body>
            <Actions>
              {activeDialog.kind === 'confirm' && (
                <ActionButton type="button" $variant="secondary" onClick={() => closeActive(false)}>
                  취소
                </ActionButton>
              )}
              <ActionButton type="button" $variant="primary" onClick={() => closeActive(true)}>
                확인
              </ActionButton>
            </Actions>
          </Modal>
        </>
      )}
    </>
  );
};

export default AppDialogProvider;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
`;

const Modal = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 420px);
  background: #f6f4ef;
  border: 1px solid #e3ded2;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 1060;
`;

const Body = styled.div`
  padding: 32px 28px 24px;
  text-align: center;
`;

const Title = styled.h3`
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: #1a1a1a;
  font-family: 'Noto Sans KR', sans-serif;
`;

const Message = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  color: #5f5a52;
`;

const Actions = styled.div`
  padding: 0 20px 20px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.$variant === 'primary' ? '#1a1a1a' : '#d6d1c7')};
  background: ${(props) => (props.$variant === 'primary' ? '#1a1a1a' : '#f6f4ef')};
  color: ${(props) => (props.$variant === 'primary' ? '#fff' : '#55524b')};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.88;
  }
`;
