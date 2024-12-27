#include "savediscard_dialog.hxx"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QLabel>

SaveDiscardDialog::SaveDiscardDialog(QWidget *parent)
    : QDialog(parent)
{
  QVBoxLayout *vbox = new QVBoxLayout();

  QLabel *text = new QLabel(tr("有尚未保存的更改"));

  vbox->addWidget(text);
  vbox->addStretch();

  QHBoxLayout *hbox = new QHBoxLayout();

  QPushButton *button;

  button = new QPushButton(tr("取消"));
  connect(button, SIGNAL(clicked()), SLOT(onCancel()));
  hbox->addWidget(button);

  button = new QPushButton(tr("放弃更改"));
  connect(button, SIGNAL(clicked()), SLOT(onDiscard()));
  hbox->addWidget(button);

  button = new QPushButton(tr("保存"));
  connect(button, SIGNAL(clicked()), SLOT(onSave()));
  hbox->addWidget(button);

  vbox->addLayout(hbox);

  setLayout(vbox);
}

void SaveDiscardDialog::onCancel()
{
  QDialog::done(Cancel);
}

void SaveDiscardDialog::onDiscard()
{
  QDialog::done(Discard);
}

void SaveDiscardDialog::onSave()
{
  QDialog::done(Save);
}

void SaveDiscardDialog::reject()
{
  onCancel();
}
