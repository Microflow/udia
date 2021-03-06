###############################################################################
# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# https://raw.githubusercontent.com/udia-software/udia/master/LICENSE.
# The License is based on the Mozilla Public License Version 1.1, but
# Sections 14 and 15 have been added to cover use of software over a computer
# network and provide for limited attribution for the Original Developer.
# In addition, Exhibit A has been modified to be consistent with Exhibit B.
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
# the specific language governing rights and limitations under the License.
#
# The Original Code is UDIA.
#
# The Original Developer is the Initial Developer.  The Initial Developer of
# the Original Code is Udia Software Incorporated.
#
# All portions of the code written by UDIA are Copyright (c) 2016-2017
# Udia Software Incorporated. All Rights Reserved.
###############################################################################
defmodule Udia.AuthsTest do
  use Udia.DataCase, async: true

  alias Udia.Auths.User

  @valid_attrs %{username: "seto", password: "123456"}
  @invalid_attrs %{username: nil, password: nil}

  def fixture(:user, attrs \\ @valid_attrs) do
    {:ok, user} = Auths.create_user(attrs)
    user
  end

  test "list_users/1 returns all users" do
    user = fixture(:user)
    assert Auths.list_users() == [user]
  end

  test "get_user! returns the user with given id" do
    user = fixture(:user)
    assert Auths.get_user!(user.id) == user
  end

  test "create_user/1 with valid data creates a user" do
    assert {:ok, %User{} = user} = Auths.create_user(@valid_attrs)

    assert user.username == "seto"
  end

  test "create_user/1 with invalid data returns error changeset" do
    assert {:error, %Ecto.Changeset{}} = Auths.create_user(@invalid_attrs)
  end

  test "change_user/1 returns a user changeset" do
    user = fixture(:user)
    assert %Ecto.Changeset{} = Auths.change_user(user)
  end

  test "changeset does not accept long usernames" do
    attrs = Map.put(@valid_attrs, :username, String.duplicate("a", 30))
    changeset = Auths.user_changeset(%User{}, attrs)
    assert "should be at most 20 character(s)" in errors_on(changeset, :username)
  end

  test "registration_changeset password must be at least 6 chars long" do
    attrs = Map.put(@valid_attrs, :password, "12345")
    changeset = Auths.registration_changeset(%User{}, attrs)
    assert {:password, {"should be at least %{count} character(s)",
            [count: 6, validation: :length, min: 6]}} in changeset.errors
  end

  test "registration_changeset with valid attributes hashes password" do
    pass = "123456"
    changeset = Auths.registration_changeset(%User{}, @valid_attrs)
    %{password_hash: pass_hash} = changeset.changes
    assert changeset.valid?
    assert pass_hash
    assert Comeonin.Bcrypt.checkpw(pass, pass_hash)
  end
end
